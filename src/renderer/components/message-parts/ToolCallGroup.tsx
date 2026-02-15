import { ActionIcon, Box, Collapse, Group, Paper, Text, ThemeIcon } from '@mantine/core'
import {
    type MessageToolCallPart,
} from '@shared/types'
import {
    IconChevronRight,
    IconTool,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { type FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScalableIcon } from '../common/ScalableIcon'
import { ToolCallPartUI } from './ToolCallPartUI'

export const ToolCallGroup: FC<{
    parts: MessageToolCallPart[]
}> = ({ parts }) => {
    const { t } = useTranslation()
    // Auto-expand if any tool is running or if there's an error
    const hasRunningOrError = useMemo(() => parts.some(p => p.state === 'call' || p.state === 'error'), [parts])
    const [isExpanded, setIsExpanded] = useState<boolean>(hasRunningOrError)

    const toggleExpanded = useCallback(() => {
        setIsExpanded((prev) => !prev)
    }, [])

    const runningCount = parts.filter(p => p.state === 'call').length
    const errorCount = parts.filter(p => p.state === 'error').length

    const statusText = useMemo(() => {
        if (runningCount > 0) return t('Running {{count}} tools...', { count: runningCount })
        if (errorCount > 0) return t('Finished with {{count}} errors', { count: errorCount })
        return t('Used {{count}} tools', { count: parts.length })
    }, [parts.length, runningCount, errorCount, t])

    return (
        <Paper withBorder radius="md" mb="xs" className="overflow-hidden border-chatbox-border-primary bg-chatbox-background-primary">
            <Box
                onClick={toggleExpanded}
                className="cursor-pointer group hover:bg-chatbox-background-secondary transition-colors duration-200"
                py={6}
                px="xs"
            >
                <Group justify="space-between" className="w-full">
                    <Group gap="xs">
                        <ThemeIcon variant="light" color={runningCount > 0 ? 'blue' : 'gray'} size="sm" radius="md">
                            <ScalableIcon icon={IconTool} size={14} />
                        </ThemeIcon>
                        <Text fw={600} size="sm" c="chatbox-text-secondary">
                            {statusText}
                        </Text>
                    </Group>
                    <Group gap="xs">
                        <ScalableIcon
                            icon={IconChevronRight}
                            size={16}
                            className={clsx('transition-transform duration-200 text-chatbox-secondary', isExpanded ? 'rotate-90' : '')}
                        />
                    </Group>
                </Group>
            </Box>

            <Collapse in={isExpanded}>
                <Box
                    className="border-t border-chatbox-border-primary bg-chatbox-background-secondary/30 flex flex-col gap-2"
                    p="sm"
                >
                    {parts.map((part) => (
                        <div key={part.toolCallId}>
                            <ToolCallPartUI part={part} />
                        </div>
                    ))}
                </Box>
            </Collapse>
        </Paper>
    )
}
