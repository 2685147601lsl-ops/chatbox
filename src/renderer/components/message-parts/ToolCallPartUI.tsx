import { ActionIcon, alpha, Badge, Box, Code, Collapse, Group, Paper, SimpleGrid, Space, Stack, Text, ThemeIcon } from '@mantine/core'

import {
  type Message,
  type MessageReasoningPart,
  type MessageToolCallPart,
  MessageToolCallPartSchema,
} from '@shared/types'
import {
  IconArrowRight,
  IconBulb,
  IconChevronRight,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconCode,
  IconCopy,
  IconLoader,
  IconTool,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { type FC, type ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import z from 'zod'
import { formatElapsedTime, useThinkingTimer } from '@/hooks/useThinkingTimer'
import { cn } from '@/lib/utils'
import { getToolName } from '@/packages/tools'
import type { SearchResultItem } from '@/packages/web-search'
import { ScalableIcon } from '../common/ScalableIcon'
import Markdown from '../Markdown'

const ToolCallHeader: FC<{ part: MessageToolCallPart; action: ReactNode; onClick: () => void }> = (props) => {
  return (
    <Paper withBorder radius="md" px="xs" onClick={props.onClick} className="cursor-pointer group">
      <Group justify="space-between" className="w-full">
        <Group gap="xs">
          <Text fw={600}>{getToolName(props.part.toolName)}</Text>
          <ScalableIcon icon={IconTool} color="var(--chatbox-tint-success)" />
          {props.part.state === 'call' ? (
            <ScalableIcon icon={IconLoader} className="animate-spin" color="var(--chatbox-tint-brand)" />
          ) : props.part.state === 'error' ? (
            <ScalableIcon icon={IconCircleXFilled} color="var(--chatbox-tint-error)" />
          ) : (
            <ScalableIcon icon={IconCircleCheckFilled} color="var(--chatbox-tint-success)" />
          )}
        </Group>
        <Space miw="xl" />
        {props.action}
      </Group>
    </Paper>
  )
}

const WebBrowsingToolCallPartSchema = MessageToolCallPartSchema.extend({
  toolName: z.literal('web_search'),
  args: z.object({
    query: z.string(),
  }),
  result: z
    .object({
      query: z.string(),
      searchResults: z.array(
        z.object({
          title: z.string(),
          snippet: z.string(),
          link: z.string(),
        })
      ),
    })
    .optional(),
})

type WebBrowsingToolCallPart = MessageToolCallPart<
  { query: string },
  { query: string; searchResults: SearchResultItem[] }
>

const getSafeExternalHref = (raw: string): string | null => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (!/^https?:\/\//i.test(trimmed)) {
    return null
  }

  try {
    return new URL(trimmed).toString()
  } catch (_error) {
    const encoded = trimmed.replace(/%(?![0-9A-Fa-f]{2})/g, '%25')
    try {
      return new URL(encoded).toString()
    } catch (_innerError) {
      return null
    }
  }
}

const SearchResultCard: FC<{ index: number; result: SearchResultItem }> = ({ index, result }) => {
  const href = getSafeExternalHref(result.link)

  const content = (
    <Paper radius="md" p={8} bg={'var(--chatbox-background-gray-secondary)'} maw={200} title={result.title}>
      <Text size="sm" truncate="end" m={0}>
        <b>{index + 1}.</b> {result.title}
      </Text>
      <Text size="xs" truncate="end" c="chatbox-tertiary" m={0} mt={4}>
        {result.link}
      </Text>
    </Paper>
  )

  if (!href) {
    return content
  }

  return (
    <Box component="a" href={href} target="_blank" rel="noopener noreferrer" className="no-underline">
      {content}
    </Box>
  )
}

const WebSearchToolCallUI: FC<{ part: WebBrowsingToolCallPart }> = ({ part }) => {
  const { t } = useTranslation()
  const [expaned, setExpand] = useState(false)
  return (
    <Stack gap="xs" mb="xs">
      <ToolCallHeader
        part={part}
        onClick={() => setExpand((prev) => !prev)}
        action={
          <ScalableIcon icon={IconChevronRight} className={clsx('transition-transform', expaned ? 'rotate-90' : '')} />
        }
      />
      <Collapse in={expaned}>
        <Stack gap="xs">
          <Group gap="xs" my={2}>
            <Text c="chatbox-tertiary" m={0}>
              {t('Search query')}:
            </Text>
            <Text fw={600} size="sm" m={0} fs="italic">
              {part.args.query}
            </Text>
          </Group>
          {part.result && (
            <SimpleGrid cols={{ sm: 3, md: 4 }} spacing="xs">
              {part.result.searchResults.map((result, index) => (
                <SearchResultCard key={result.link} index={index} result={result} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Collapse>
      <Collapse in={!expaned}>
        {part.result && (
          <Group gap="xs" wrap="nowrap" className="overflow-x-auto" pb="xs">
            {part.result.searchResults.map((result, index) => (
              <SearchResultCard key={result.link} index={index} result={result} />
            ))}
          </Group>
        )}
      </Collapse>
    </Stack>
  )
}

const GeneralToolCallUI: FC<{ part: MessageToolCallPart }> = ({ part }) => {
  const { t } = useTranslation()
  const [expanded, setExpand] = useState(false)
  const isError = part.state === 'error'

  return (
    <Stack gap="xs" mb="xs">
      <ToolCallHeader
        part={part}
        onClick={() => setExpand((prev) => !prev)}
        action={
          <ScalableIcon icon={IconChevronRight} className={clsx('transition-transform', expanded ? 'rotate-90' : '')} />
        }
      />

      <Collapse in={expanded}>
        <Paper withBorder radius="md" p="sm" className={cn(isError ? "border-red-200 bg-red-50/30" : "")}>
          <Stack gap="xs">
            <Group gap="xs" c="chatbox-tertiary">
              <ScalableIcon icon={IconCode} size={14} />
              <Text fw={600} size="xs" c="chatbox-tertiary" m="0">
                {t('Arguments')}
              </Text>
            </Group>
            <Box>
              <Code block className="text-xs">{JSON.stringify(part.args, null, 2)}</Code>
            </Box>
          </Stack>
          {!!part.result && (
            <Stack gap="xs" className="mt-3 pt-3 border-t border-dashed border-chatbox-border-primary">
              <Group gap="xs" c={isError ? "red.6" : "chatbox-tertiary"}>
                <ScalableIcon icon={isError ? IconCircleXFilled : IconArrowRight} size={14} />
                <Text fw={600} size="xs" m="0">
                  {isError ? t('Error') : t('Result')}
                </Text>
              </Group>
              <Box className="max-h-[400px] overflow-auto">
                {typeof part.result === 'string' ? (
                  <div className={cn("text-sm", isError ? "text-red-700" : "")}>
                    <Markdown>{part.result}</Markdown>
                  </div>
                ) : (
                  <Code block className="text-xs">{JSON.stringify(part.result, null, 2)}</Code>
                )}
              </Box>
            </Stack>
          )}
        </Paper>
      </Collapse>
    </Stack>
  )
}

const PythonToolUI: FC<{ part: MessageToolCallPart }> = ({ part }) => {
  const { t } = useTranslation()
  const [expaned, setExpand] = useState(true)
  const code = (part.args as any)?.code || ''
  const result = part.result as string || ''

  return (
    <Stack gap="xs" mb="xs">
      <ToolCallHeader
        part={part}
        onClick={() => setExpand((prev) => !prev)}
        action={
          <ScalableIcon icon={IconChevronRight} className={clsx('transition-transform', expaned ? 'rotate-90' : '')} />
        }
      />
      <Collapse in={expaned}>
        <Stack gap="xs">
          <Code block color="blue.1" c="blue.9" p="xs">
            {code}
          </Code>
          {result && (
            <Code block p="xs">
              {result}
            </Code>
          )}
        </Stack>
      </Collapse>
    </Stack>
  )
}

const BrowserToolUI: FC<{ part: MessageToolCallPart }> = ({ part }) => {
  const { t } = useTranslation()
  const [expaned, setExpand] = useState(true)
  const url = (part.args as any)?.url || ''
  const action = (part.args as any)?.action || 'open'
  const result = part.result as string || ''

  return (
    <Stack gap="xs" mb="xs">
      <ToolCallHeader
        part={part}
        onClick={() => setExpand((prev) => !prev)}
        action={
          <ScalableIcon icon={IconChevronRight} className={clsx('transition-transform', expaned ? 'rotate-90' : '')} />
        }
      />
      <Collapse in={expaned}>
        <Stack gap="xs">
          <Group gap="xs">
            <Badge size="xs" variant="filled">{action}</Badge>
            <Text size="xs" truncate="end" fw={600}>{url}</Text>
          </Group>
          {result && (
            <Paper withBorder p="xs" bg="gray.0">
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-line' }}>{result}</Text>
            </Paper>
          )}
        </Stack>
      </Collapse>
    </Stack>
  )
}

const SequentialThinkingToolUI: FC<{ part: MessageToolCallPart }> = ({ part }) => {
  const { t } = useTranslation()
  const [expaned, setExpand] = useState(true)
  const args = part.args as any
  const isRevision = args.isRevision

  return (
    <Box mb="xs">
      <Group
        gap="xs"
        onClick={() => setExpand((prev) => !prev)}
        className="cursor-pointer py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md px-2 transition-all duration-200"
      >
        <ThemeIcon
          variant="light"
          color={isRevision ? 'orange' : 'blue'}
          size="sm"
          radius="xl"
          className={cn(part.state === 'call' ? 'animate-pulse' : '')}
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        >
          <IconBulb size={12} />
        </ThemeIcon>
        <Text size="xs" fw={700} c={isRevision ? 'orange.8' : 'blue.8'} className="tracking-tight">
          {isRevision ? t('Revision') : t('Thought')} #{args.thoughtNumber}
          {args.totalThoughts ? ` / ${args.totalThoughts}` : ''}
        </Text>
        <ScalableIcon
          icon={IconChevronRight}
          size={12}
          className={clsx('transition-transform opacity-30', expaned ? 'rotate-90' : '')}
        />
      </Group>
      <Collapse in={expaned}>
        <Box pl={32} pb={6} pr={8}>
          <Text
            size="sm"
            c="chatbox-text-secondary"
            style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontStyle: 'italic' }}
            className="opacity-90"
          >
            {args.thought}
          </Text>
        </Box>
      </Collapse>
    </Box>
  )
}

export const ToolCallPartUI: FC<{ part: MessageToolCallPart }> = ({ part }) => {
  if (part.toolName === 'web_search') {
    const parsedPart = WebBrowsingToolCallPartSchema.safeParse(part)
    if (parsedPart.success) {
      return <WebSearchToolCallUI part={parsedPart.data as WebBrowsingToolCallPart} />
    }
  }

  if (part.toolName.includes('sequentialthinking')) {
    return <SequentialThinkingToolUI part={part} />
  }

  if (part.toolName.includes('python')) {
    return <PythonToolUI part={part} />
  }

  if (part.toolName.includes('browser')) {
    return <BrowserToolUI part={part} />
  }

  return <GeneralToolCallUI part={part} />
}

