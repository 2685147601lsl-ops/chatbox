
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import {
    ActionIcon,
    Box,
    Button,
    Card,
    Flex,
    Grid,
    Group,
    Image,
    Modal,
    ScrollArea,
    Stack,
    Text,
    rem,
} from '@mantine/core'
import { IconDownload, IconFileDownload, IconVideo } from '@tabler/icons-react'
import { useMemo, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import type { Message, Session } from '@shared/types'
import { sanitizeUrl } from '@braintree/sanitize-url'
import { ScalableIcon } from '@/components/common/ScalableIcon'

interface VideoItem {
    id: string
    url: string
    poster: string
    filename: string
    size?: string
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

function extractVideosFromMessage(content: string): VideoItem[] {
    const videos: VideoItem[] = []
    // Regex to match the specific video structure provided by user:
    // <video id="video" controls="" preload="none" poster="...">
    //   <source id="mp4" src="..." type="video/mp4">
    // </video>

    // We use a relatively loose regex to capture src and poster attributes from video tags
    // This handles the specific format and similar variations
    const videoRegex = /<video[^>]*poster="([^"]*)"[^>]*>[\s\S]*?<source[^>]*src="([^"]*)"[^>]*>[\s\S]*?<\/video>/g

    let match
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration pattern
    while ((match = videoRegex.exec(content)) !== null) {
        const poster = match[1]
        const src = match[2]

        if (src) {
            // Extract filename from URL
            const filename = src.split('/').pop()?.split('?')[0] || `video-${Date.now()}.mp4`

            videos.push({
                id: uuidv4(),
                url: src,
                poster: poster || '',
                filename
            })
        }
    }

    return videos
}

export default NiceModal.create(({ session }: { session: Session }) => {
    const modal = useModal()
    const { t } = useTranslation()

    const videos = useMemo(() => {
        if (!session?.messages) return []

        return session.messages.flatMap(msg => {
            if (msg.role === 'assistant' || msg.role === 'user') {
                // Handle contentParts
                if (msg.contentParts) {
                    return msg.contentParts.flatMap(part => {
                        if (part.type === 'text' && part.text) {
                            return extractVideosFromMessage(part.text)
                        }
                        return []
                    })
                }
            }
            return []
        })
    }, [session])

    const [videoSizes, setVideoSizes] = useState<Record<string, string>>({})

    useEffect(() => {
        videos.forEach(async (video) => {
            if (videoSizes[video.id]) return

            try {
                const response = await axios.head(video.url)
                const size = response.headers['content-length']
                if (size) {
                    setVideoSizes(prev => ({ ...prev, [video.id]: formatBytes(Number(size)) }))
                } else {
                    setVideoSizes(prev => ({ ...prev, [video.id]: 'Unknown size' }))
                }
            } catch (error) {
                console.error('Failed to get video size', error)
                setVideoSizes(prev => ({ ...prev, [video.id]: 'Unknown size' }))
            }
        })
    }, [videos, videoSizes])

    const videosWithSize = useMemo(() => {
        return videos.map(v => ({
            ...v,
            size: videoSizes[v.id]
        }))
    }, [videos, videoSizes])

    const handleDownload = (url: string, filename: string) => {
        const a = document.createElement('a')
        a.href = sanitizeUrl(url)
        a.download = filename
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    return (
        <Modal
            opened={modal.visible}
            onClose={modal.hide}
            title={
                <Group gap="xs">
                    <ScalableIcon icon={IconVideo} size={20} />
                    <Text fw={600}>{t('Video Downloads')}</Text>
                    <Text size="xs" c="dimmed">({videos.length})</Text>
                </Group>
            }
            size="lg"
            centered
            zIndex={100}
        >
            <ScrollArea.Autosize mah="60vh" offsetScrollbars>
                {videosWithSize.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" p="xl" gap="md" c="dimmed">
                        <IconVideo size={48} stroke={1.5} style={{ opacity: 0.5 }} />
                        <Text>{t('No videos found in this conversation')}</Text>
                    </Flex>
                ) : (
                    <Stack gap="md">
                        {videosWithSize.map((video) => (
                            <Card key={video.id} withBorder padding="sm" radius="md">
                                <Grid align="center" gutter="sm">
                                    {/* Thumbnail */}
                                    <Grid.Col span={3}>
                                        <Box
                                            className="relative rounded-md overflow-hidden bg-black/5 aspect-video flex items-center justify-center"
                                        >
                                            {video.poster ? (
                                                <Image
                                                    src={sanitizeUrl(video.poster)}
                                                    alt="Thumbnail"
                                                    fit="cover"
                                                    h="100%"
                                                    w="100%"
                                                />
                                            ) : (
                                                <IconVideo size={24} className="text-gray-400" />
                                            )}
                                        </Box>
                                    </Grid.Col>

                                    {/* Info */}
                                    <Grid.Col span={7}>
                                        <Stack gap={4}>
                                            <Text fw={500} size="sm" lineClamp={1} title={video.filename}>
                                                {video.filename}
                                            </Text>
                                            <Text size="xs" c="dimmed" className="font-mono">
                                                MP4 • {video.size || t('Loading size...')}
                                            </Text>
                                        </Stack>
                                    </Grid.Col>

                                    {/* Actions */}
                                    <Grid.Col span={2}>
                                        <Flex justify="flex-end">
                                            <Button
                                                variant="light"
                                                size="xs"
                                                leftSection={<IconDownload size={14} />}
                                                onClick={() => handleDownload(video.url, video.filename)}
                                            >
                                                {t('Download')}
                                            </Button>
                                        </Flex>
                                    </Grid.Col>
                                </Grid>
                            </Card>
                        ))}
                    </Stack>
                )}
            </ScrollArea.Autosize>
        </Modal>
    )
})
