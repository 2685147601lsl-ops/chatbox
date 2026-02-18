/**
 * Butler Window - A dedicated AI assistant window
 * 
 * Features:
 * - Floating robot icon in bottom-right corner
 * - Opens a chat drawer with Butler AI
 * - Automatically routes user intent to appropriate models:
 *   - Text chat → grok-4-mini
 *   - Image generation → grok-imagine-1.0  
 *   - Video generation → grok-imagine-1.0-video
 *   - Image editing → grok-imagine-1.0-edit
 * - No model selection (automatic)
 * - No MCP integration
 */

import {
    ActionIcon,
    Box,
    Drawer,
    Flex,
    Loader,
    ScrollArea,
    Stack,
    Text,
    Textarea,
    Tooltip,
} from '@mantine/core'
import {
    IconArrowUp,
    IconPlayerStopFilled,
    IconRobot,
    IconTrash,
    IconX,
} from '@tabler/icons-react'
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { getModel } from '@shared/models'
import { type Message, ModelProviderEnum, type SessionSettings } from '@shared/types'
import type { OnResultChangeWithCancel } from '@shared/models/types'
import { createModelDependencies } from '@/adapters'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { settingsStore } from '@/stores/settingsStore'
import { streamText } from '@/packages/model-calls/stream-text'
import { genMessageContext } from '@/stores/session/generation'
import Markdown from '@/components/Markdown'
// @ts-ignore
import { ScalableIcon } from '@/components/common/ScalableIcon'

console.log('ButlerWindow module loaded')

// Butler model IDs
const BUTLER_CHAT_MODEL = 'grok-4-mini'
const BUTLER_IMAGINE_MODEL = 'grok-imagine-1.0'
const BUTLER_VIDEO_MODEL = 'grok-imagine-1.0-video'
const BUTLER_EDIT_MODEL = 'grok-imagine-1.0-edit'

type IntentType = 'chat' | 'image' | 'video' | 'edit'

interface ButlerMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    generating?: boolean
    error?: string
    intentLabel?: string
    cancel?: () => void
    reasoning_content?: string
}

function getModelForIntent(intent: IntentType): string {
    switch (intent) {
        case 'image':
            return BUTLER_IMAGINE_MODEL
        case 'video':
            return BUTLER_VIDEO_MODEL
        case 'edit':
            return BUTLER_EDIT_MODEL
        case 'chat':
        default:
            return BUTLER_CHAT_MODEL
    }
}

function getIntentLabel(intent: IntentType): string {
    switch (intent) {
        case 'image':
            return '🎨 Image Generation'
        case 'video':
            return '🎬 Video Generation'
        case 'edit':
            return '✏️ Image Editing'
        case 'chat':
        default:
            return '💬 Chat'
    }
}

// Create session settings for Butler
function createButlerSettings(modelId: string): SessionSettings {
    return {
        provider: ModelProviderEnum.Steward,
        modelId,
        temperature: 0.7,
        topP: 1,
        maxContextMessageCount: 20,
        stream: true,
    }
}

// Convert ButlerMessages to the Message format the system expects
function toSystemMessages(butlerMessages: ButlerMessage[]): Message[] {
    return butlerMessages.map(m => ({
        id: m.id,
        role: m.role as any,
        contentParts: [{ type: 'text' as const, text: m.content }],
        timestamp: Date.now(),
    }))
}

export function ButlerWindow() {
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ButlerMessage[]>([])
    const [input, setInput] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isAnalyzingIntent, setIsAnalyzingIntent] = useState(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('.mantine-ScrollArea-viewport')
            if (viewport) {
                setTimeout(() => {
                    viewport.scrollTop = viewport.scrollHeight
                }, 50)
            }
        }
    }, [messages])

    // Analyze user intent using RegEx - FAST & NO API CALLS (to avoid 429)
    const analyzeIntent = useCallback(async (userMessage: string): Promise<IntentType> => {
        const lowerMsg = userMessage.toLowerCase()

        // 1. Video Intent
        if (/(视频|影片|动画|动图|video|movie|gif)/i.test(lowerMsg)) {
            return 'video'
        }

        // 2. Edit Intent
        if (/(修改|编辑|改下|换个|P图|edit|modify|change)/i.test(lowerMsg)) {
            return 'edit'
        }

        // 3. Image Intent - Broad matching for Chinese and English
        // Matches "生成...图", "画一只...", "一张照片" etc.
        const imageKeywords = /(画|绘|图|写生|生成|创作|一张|一个|一只|个|只|照片|像|draw|generate|create|paint|photo|image|picture|pic)/i
        if (imageKeywords.test(lowerMsg)) {
            return 'image'
        }

        // 4. Default to Chat
        return 'chat'
    }, [])

    const getSystemMessageForIntent = useCallback((intent: IntentType): string => {
        switch (intent) {
            case 'image':
                // Simple instruction to stay focused and only generate one
                return 'You are an AI artist. Generate exactly one image based on the user prompt. Do not add extra elements like "butler" unless requested.'
            case 'video':
                return 'Generate a cinematic video based on the user prompt.'
            case 'edit':
                return 'Edit the image according to the user instructions.'
            case 'chat':
            default:
                return 'You are Butler, a helpful AI assistant.'
        }
    }, [])

    // Generate a response using the appropriate model
    const generateResponse = useCallback(async (
        conversationHistory: ButlerMessage[],
        modelId: string,
        assistantMsgId: string,
        intent: IntentType,
    ) => {
        const settings = createButlerSettings(modelId)
        const dependencies = await createModelDependencies()
        const globalSettings = settingsStore.getState().getSettings()
        const model = getModel(settings, globalSettings, { uuid: '' }, dependencies)

        const controller = new AbortController()
        abortControllerRef.current = controller

        const contextMessages = toSystemMessages(conversationHistory)
        const promptMsgs = await genMessageContext(
            settings,
            contextMessages,
            false,
        )

        // Inject specialized system instruction
        const specializedSystemMsg: Message = {
            id: uuidv4(),
            role: 'system' as any,
            contentParts: [{ type: 'text', text: getSystemMessageForIntent(intent) }],
            timestamp: Date.now(),
        }
        const finalMessages = [specializedSystemMsg, ...promptMsgs]

        try {
            const onResultChangeWithCancel: OnResultChangeWithCancel = (data) => {
                if (data.cancel) {
                    const cancelFn = data.cancel
                    setMessages(prev => prev.map(m =>
                        m.id === assistantMsgId ? { ...m, cancel: cancelFn } : m
                    ))
                }
                const textPart = data.contentParts?.find(p => p.type === 'text')
                if (textPart && 'text' in textPart) {
                    setMessages(prev => prev.map(m =>
                        m.id === assistantMsgId
                            ? { ...m, content: textPart.text || '', generating: true, reasoning_content: (data as any).reasoning_content }
                            : m
                    ))
                }
            }

            await streamText(model, {
                messages: finalMessages,
                onResultChangeWithCancel,
                mcpMode: 'disabled',
                webBrowsing: false,
            })

            setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                    ? { ...m, generating: false, cancel: undefined }
                    : m
            ))
            setIsGenerating(false)
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            if (error.name === 'AbortError') {
                setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                        ? { ...m, generating: false, cancel: undefined }
                        : m
                ))
            } else {
                setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                        ? { ...m, generating: false, cancel: undefined, error: error.message }
                        : m
                ))
            }
            setIsGenerating(false)
        }
    }, [getSystemMessageForIntent])

    // Handle message submission
    const handleSubmit = useCallback(async () => {
        const trimmedInput = input.trim()
        if (!trimmedInput || isGenerating) return

        const userMsg: ButlerMessage = {
            id: uuidv4(),
            role: 'user',
            content: trimmedInput,
        }

        const assistantMsg: ButlerMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: '',
            generating: true,
        }

        setInput('')
        setIsGenerating(true)
        setIsAnalyzingIntent(true)

        const newMessages = [...messages, userMsg, assistantMsg]
        setMessages(newMessages)

        try {
            const intent = await analyzeIntent(trimmedInput)
            const modelId = getModelForIntent(intent)

            setIsAnalyzingIntent(false)

            setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id
                    ? { ...m, intentLabel: intent === 'chat' ? '' : `✨ ${getIntentLabel(intent)}` }
                    : m
            ))

            // Add longer delay to prevent rate limiting (429) - 3000ms for strict 30/min limit
            await new Promise(resolve => setTimeout(resolve, 3000))

            // Generate response with the appropriate model
            await generateResponse(
                newMessages.filter(m => m.role === 'user' || (m.role === 'assistant' && m.id !== assistantMsg.id)),
                modelId,
                assistantMsg.id,
                intent
            )
        } catch (err) {
            setIsAnalyzingIntent(false)
            const error = err instanceof Error ? err : new Error(String(err))
            setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id
                    ? { ...m, generating: false, error: error.message }
                    : m
            ))
            setIsGenerating(false)
        }
    }, [input, isGenerating, messages, analyzeIntent, generateResponse])

    const handleStopGenerating = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        const generatingMsg = messages.find(m => m.generating)
        if (generatingMsg?.cancel) {
            generatingMsg.cancel()
        }
        setMessages(prev => prev.map(m =>
            m.generating ? { ...m, generating: false, cancel: undefined } : m
        ))
        setIsGenerating(false)
    }, [messages])

    const handleClear = useCallback(() => {
        if (isGenerating) {
            handleStopGenerating()
        }
        setMessages([])
    }, [isGenerating, handleStopGenerating])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }, [handleSubmit])

    return (
        <>
            <Tooltip label="Butler AI" position="left" withArrow>
                <ActionIcon
                    id="butler-fab"
                    size={52}
                    radius="xl"
                    variant="filled"
                    color="chatbox-brand"
                    onClick={() => setIsOpen(true)}
                    className="fixed z-[1900] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                    style={{
                        bottom: isSmallScreen ? 80 : 24,
                        right: isSmallScreen ? 16 : 24,
                    }}
                >
                    <IconRobot size={28} stroke={1.5} />
                </ActionIcon>
            </Tooltip>

            <Drawer
                opened={isOpen}
                onClose={() => setIsOpen(false)}
                position="right"
                size={isSmallScreen ? '100%' : 420}
                withCloseButton={false}
                zIndex={2000}
                styles={{
                    body: {
                        padding: 0,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                    content: {
                        backgroundColor: 'var(--chatbox-background-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <Flex
                    align="center"
                    justify="space-between"
                    px="md"
                    py="sm"
                    className="shrink-0 border-0 border-b border-solid border-chatbox-border-primary"
                    style={{ paddingTop: 'calc(var(--mobile-safe-area-inset-top, 0px) + 8px)' }}
                >
                    <Flex align="center" gap="sm">
                        <Box
                            className="rounded-full flex items-center justify-center"
                            w={36}
                            h={36}
                            style={{
                                background: 'linear-gradient(135deg, var(--chatbox-tint-brand), #7c3aed)',
                            }}
                        >
                            <IconRobot size={22} color="white" stroke={1.5} />
                        </Box>
                        <Stack gap={0}>
                            <Text fw={600} size="sm">Butler AI</Text>
                            <Text size="xxs" c="chatbox-tertiary">
                                {isAnalyzingIntent ? t('Analyzing intent...') : t('Your personal AI assistant')}
                            </Text>
                        </Stack>
                    </Flex>

                    <Flex align="center" gap="xs">
                        <Tooltip label={t('Clear conversation')} withArrow>
                            <ActionIcon
                                variant="subtle"
                                color="chatbox-tertiary"
                                size={28}
                                onClick={handleClear}
                                disabled={messages.length === 0}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <ActionIcon
                            variant="subtle"
                            color="chatbox-tertiary"
                            size={28}
                            onClick={() => setIsOpen(false)}
                        >
                            <IconX size={18} />
                        </ActionIcon>
                    </Flex>
                </Flex>

                <ScrollArea
                    flex={1}
                    ref={scrollAreaRef}
                    type="hover"
                    scrollHideDelay={500}
                    className="min-h-0"
                >
                    <Stack gap="md" p="md">
                        {messages.length === 0 && (
                            <Stack align="center" justify="center" gap="sm" py="xl">
                                <Box
                                    className="rounded-full flex items-center justify-center"
                                    w={64}
                                    h={64}
                                    style={{
                                        background: 'linear-gradient(135deg, var(--chatbox-tint-brand), #7c3aed)',
                                        opacity: 0.15,
                                    }}
                                >
                                    <IconRobot size={36} className="text-[var(--chatbox-tint-brand)]" stroke={1.2} />
                                </Box>
                                <Text size="sm" c="chatbox-tertiary" ta="center" maw={280}>
                                    {t('Hi! I\'m your Butler AI assistant. I can chat, generate images, create videos, and edit images. Just tell me what you need!')}
                                </Text>
                            </Stack>
                        )}

                        {messages.map((msg) => (
                            <Flex
                                key={msg.id}
                                direction={msg.role === 'user' ? 'row-reverse' : 'row'}
                                gap="xs"
                                align="flex-start"
                            >
                                {msg.role === 'assistant' && (
                                    <Box
                                        className="rounded-full flex items-center justify-center shrink-0"
                                        w={28}
                                        h={28}
                                        mt={2}
                                        style={{
                                            background: 'linear-gradient(135deg, var(--chatbox-tint-brand), #7c3aed)',
                                        }}
                                    >
                                        <IconRobot size={16} color="white" stroke={1.5} />
                                    </Box>
                                )}

                                <Stack gap={2} maw="80%">
                                    {msg.intentLabel && msg.role === 'assistant' && (
                                        <Text size="xxs" c="chatbox-tertiary">
                                            {msg.intentLabel}
                                        </Text>
                                    )}

                                    <Box
                                        className="rounded-xl px-3 py-2"
                                        style={{
                                            backgroundColor: msg.role === 'user'
                                                ? 'var(--chatbox-tint-brand)'
                                                : 'var(--chatbox-background-secondary)',
                                            color: msg.role === 'user' ? 'white' : undefined,
                                            borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                                            borderBottomLeftRadius: msg.role === 'assistant' ? 4 : undefined,
                                        }}
                                    >
                                        {msg.role === 'user' ? (
                                            <Text size="sm" style={{ color: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {msg.content}
                                            </Text>
                                        ) : (
                                            <>
                                                {msg.reasoning_content && (
                                                    <Box
                                                        className="rounded-md mb-2 px-2 py-1"
                                                        style={{
                                                            backgroundColor: 'var(--chatbox-background-tertiary)',
                                                            borderLeft: '2px solid var(--chatbox-tint-brand)',
                                                        }}
                                                    >
                                                        <Text size="xxs" c="chatbox-tertiary" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {msg.reasoning_content}
                                                        </Text>
                                                    </Box>
                                                )}
                                                {msg.content ? (
                                                    <div className="text-sm text-chatbox-primary markdown-body">
                                                        <Markdown uniqueId={msg.id}>{msg.content}</Markdown>
                                                    </div>
                                                ) : msg.generating ? (
                                                    <Flex align="center" gap="xs">
                                                        <Loader size={14} />
                                                        <Text size="xs" c="chatbox-tertiary">
                                                            {isAnalyzingIntent ? t('Analyzing your request...') : t('Generating...')}
                                                        </Text>
                                                    </Flex>
                                                ) : null}
                                                {msg.error && (
                                                    <Text size="xs" c="red" mt="xs">
                                                        ⚠️ {msg.error}
                                                    </Text>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                </Stack>
                            </Flex>
                        ))}
                    </Stack>
                </ScrollArea>

                <Stack
                    gap="xs"
                    p="md"
                    className="shrink-0 border-0 border-t border-solid border-chatbox-border-primary"
                    style={{ paddingBottom: 'calc(var(--mobile-safe-area-inset-bottom, 0px) + 16px)' }}
                >
                    <Flex align="flex-end" gap="xs">
                        <Textarea
                            ref={inputRef}
                            flex={1}
                            size="sm"
                            radius="xl"
                            placeholder={t('Ask Butler anything...') || ''}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autosize
                            minRows={1}
                            maxRows={4}
                            styles={{
                                input: {
                                    paddingRight: '12px',
                                    backgroundColor: 'var(--chatbox-background-secondary)',
                                    border: '1px solid var(--chatbox-border-primary)',
                                },
                            }}
                        />
                        <ActionIcon
                            size={36}
                            radius="xl"
                            variant="filled"
                            color={isGenerating ? 'dark' : 'chatbox-brand'}
                            onClick={isGenerating ? handleStopGenerating : handleSubmit}
                            disabled={!isGenerating && (!input.trim())}
                            className="shrink-0"
                        >
                            {isGenerating ? (
                                <ScalableIcon icon={IconPlayerStopFilled} size={16} />
                            ) : (
                                <ScalableIcon icon={IconArrowUp} size={16} />
                            )}
                        </ActionIcon>
                    </Flex>

                    <Text size="xxs" c="chatbox-tertiary" ta="center">
                        Butler AI • {t('Auto-routing to the best model for your needs')}
                    </Text>
                </Stack>
            </Drawer>
        </>
    )
}

export default ButlerWindow
