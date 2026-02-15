import { ActionIcon, Badge, Box, Collapse, Group, Paper, Space, Text } from '@mantine/core'
import {
    type Message,
    type MessageReasoningPart,
} from '@shared/types'
import {
    IconBulb,
    IconChevronRight,
    IconCopy,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { type FC, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatElapsedTime, useThinkingTimer } from '@/hooks/useThinkingTimer'
import { cn } from '@/lib/utils'
import { ScalableIcon } from '../common/ScalableIcon'

export const ReasoningBlock: FC<{
    message: Message
    part?: MessageReasoningPart
    onCopyReasoningContent: (content: string) => (e: React.MouseEvent<HTMLButtonElement>) => void
}> = ({ message, part, onCopyReasoningContent }) => {
    const reasoningContent = part?.text || message.reasoningContent || ''
    const { t } = useTranslation()
    const isThinking =
        (message.generating &&
            part &&
            message.contentParts &&
            message.contentParts.length > 0 &&
            message.contentParts[message.contentParts.length - 1] === part) ||
        (message.generating && !part && !message.contentParts?.some(p => p.type === 'text' && p.text.length > 0)) ||
        false
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    // Timer state management
    const elapsedTime = useThinkingTimer(part?.startTime, isThinking)
    const shouldShowTimer = message.isStreamingMode !== false

    const displayTime =
        part?.duration && part.duration > 0 ? part.duration : isThinking && elapsedTime > 0 ? elapsedTime : 0

    const toggleExpanded = useCallback(() => {
        setIsExpanded((prev) => !prev)
    }, [])

    return (
        <Paper
            withBorder
            radius="md"
            mb="xs"
            className={cn(
                "overflow-hidden transition-all duration-300",
                isThinking ? "border-chatbox-border-brand shadow-md" : "border-chatbox-border-primary shadow-sm"
            )}
            style={{
                backgroundColor: 'var(--chatbox-background-primary)',
                backdropFilter: 'blur(8px)',
            }}
        >
            <Box
                onClick={toggleExpanded}
                className="cursor-pointer group hover:bg-chatbox-background-secondary/50 transition-colors duration-200"
                py={10}
            >
                <Group px="sm" justify="space-between" className="w-full">
                    <Group gap="xs">
                        <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full transition-all duration-500",
                            isThinking ? "bg-chatbox-background-brand-secondary text-chatbox-primary animate-pulse" : "bg-chatbox-background-secondary text-chatbox-secondary"
                        )}>
                            <ScalableIcon icon={IconBulb} size={14} />
                        </div>
                        <Text fw={600} size="sm" className={cn(isThinking ? "text-chatbox-primary" : "text-chatbox-secondary")}>
                            {isThinking ? t('Thinking...') : t('Thought Process')}
                        </Text>
                        {shouldShowTimer && (
                            <Badge variant="outline" size="xs" color={isThinking ? "blue" : "gray"} className="font-mono px-1">
                                {formatElapsedTime(displayTime)}
                            </Badge>
                        )}
                    </Group>
                    <Group gap="xs">
                        {reasoningContent.length > 0 && (
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCopyReasoningContent(reasoningContent)(e)
                                }}
                                aria-label={t('Copy reasoning content')}
                            >
                                <ScalableIcon icon={IconCopy} size={14} />
                            </ActionIcon>
                        )}

                        <ScalableIcon
                            icon={IconChevronRight}
                            size={16}
                            className={clsx('transition-transform duration-300 text-chatbox-secondary', isExpanded ? 'rotate-90' : '')}
                        />
                    </Group>
                </Group>
            </Box>

            <Collapse in={isExpanded}>
                <Box
                    className="border-t border-chatbox-border-primary/50 bg-chatbox-background-secondary/10"
                    p="md"
                >
                    <Text
                        size="sm"
                        style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}
                        className="text-chatbox-text-secondary select-text italic opacity-90"
                    >
                        {reasoningContent || (isThinking ? <span className="animate-pulse">{t('Analyzing request...')}</span> : '')}
                    </Text>
                </Box>
            </Collapse>
        </Paper>
    )
}
