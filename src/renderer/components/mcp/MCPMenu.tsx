import { ActionIcon, Badge, Button, Checkbox, Flex, Group, Menu, Stack, Switch, Text } from '@mantine/core'
import {
  IconCircleOff,
  IconHammer,
  IconSettings2,
  IconSparkles,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { type FC, type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMCPServerStatus, useToggleMCPServer } from '@/hooks/mcp'
import { mcpController, normalizeToolName } from '@/packages/mcp/controller'
import { navigateToSettings } from '@/modals/Settings'
import { BUILTIN_MCP_SERVERS } from '@/packages/mcp/builtin'
import { useMcpSettings } from '@/stores/settingsStore'
import { uiStore, useUIStore } from '@/stores/uiStore'
import { ScalableIcon } from '../common/ScalableIcon'
import MCPStatus from './MCPStatus'

interface ServerItemProps {
  id: string
  name: string
  enabled: boolean
}

const ServerItem: FC<{
  item: ServerItemProps
  onEnabledChange: (id: string, enabled: boolean) => void
  showTools?: boolean
  forcedTools: string[]
  onToggleTool: (toolName: string) => void
}> = ({ item, onEnabledChange, showTools, forcedTools, onToggleTool }) => {
  const status = useMCPServerStatus(item.id)
  const server = mcpController.servers.get(item.id)

  // Use public methods to get tools if possible, or cast to any for internal access
  const tools = useMemo(() => {
    const instance = (server as any)?.instance
    if (!instance?.tools) return []
    return Object.keys(instance.tools)
  }, [server])

  return (
    <>
      <Menu.Item
        c="chatbox-primary"
        leftSection={<MCPStatus status={status} />}
        rightSection={
          <Switch
            checked={item.enabled}
            size="xs"
            disabled={status?.state === 'starting' || status?.state === 'stopping'}
            onChange={(e) => onEnabledChange(item.id, e.currentTarget.checked)}
          />
        }
      >
        <Text size="sm" fw={500}>
          {item.name}
        </Text>
      </Menu.Item>
      {showTools && item.enabled && tools.length > 0 && (
        <Stack gap={2} pl={40} pb={8} pr={12}>
          {tools.map((rawToolName: string) => {
            const normalizedName = normalizeToolName(item.name, rawToolName)
            return (
              <Flex
                key={rawToolName}
                align="center"
                gap={8}
                style={{ cursor: 'pointer' }}
                onClick={() => onToggleTool(normalizedName)}
              >
                <Checkbox
                  size="xs"
                  checked={forcedTools.includes(normalizedName)}
                  readOnly
                  styles={{ input: { cursor: 'pointer' } }}
                />
                <Text size="xs" color="dimmed" style={{ wordBreak: 'break-all' }}>
                  {rawToolName}
                </Text>
              </Flex>
            )
          })}
        </Stack>
      )}
    </>
  )
}

const EMPTY_ARRAY: string[] = []

const MCPMenu: FC<{ sessionId?: string; children: (enabledTools: number) => ReactNode }> = ({
  sessionId = 'new',
  children,
}) => {
  const { t } = useTranslation()
  const mcp = useMcpSettings()
  const mode = useUIStore((s) => s.inputBoxMcpModeMap[sessionId]) || 'auto'
  const forcedTools = useUIStore((s) => s.inputBoxForceToolsMap[sessionId]) || EMPTY_ARRAY

  const setMode = (nextMode: 'auto' | 'manual' | 'disabled') =>
    uiStore.getState().setInputBoxMcpMode(sessionId, nextMode)
  const setForcedTools = (nextTools: string[]) =>
    uiStore.getState().setInputBoxForceTools(sessionId, nextTools)

  const onEnabledChange = useToggleMCPServer()
  const enabledToolsCount = mcp.servers.filter((s) => s.enabled).length + mcp.enabledBuiltinServers.length
  const [opened, setOpened] = useState(false)

  const handleToggleTool = (toolName: string) => {
    if (forcedTools.includes(toolName)) {
      setForcedTools(forcedTools.filter((t) => t !== toolName))
    } else {
      setForcedTools([...forcedTools, toolName])
    }
  }

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      shadow="md"
      withArrow
      width={240}
      closeOnItemClick={false}
      position="top-start"
      transitionProps={{
        transition: 'pop',
        duration: 200,
      }}
    >
      <Menu.Target>{children(enabledToolsCount)}</Menu.Target>
      <Menu.Dropdown p={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Group gap={8}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts="1px">
              MCP Tools
            </Text>
            {mode === 'auto' && (
              <Badge size="xs" variant="light" color="blue" leftSection={<IconSparkles size={10} />}>
                Auto
              </Badge>
            )}
            {mode === 'manual' && (
              <Badge size="xs" variant="light" color="orange" leftSection={<IconHammer size={10} />}>
                Manual
              </Badge>
            )}
          </Group>
          <ActionIcon
            variant="subtle"
            size={20}
            onClick={() => {
              setOpened(false)
              navigateToSettings('/mcp')
            }}
          >
            <ScalableIcon icon={IconSettings2} size={14} color="var(--chatbox-tint-tertiary)" />
          </ActionIcon>
        </Flex>

        <Menu.Divider />

        <Menu.Label>{t('Mode')}</Menu.Label>
        <Menu.Item
          leftSection={
            <IconSparkles size={16} color={mode === 'auto' ? 'var(--mantine-color-blue-6)' : undefined} />
          }
          onClick={() => setMode('auto')}
          bg={mode === 'auto' ? 'var(--mantine-color-blue-light)' : undefined}
        >
          <Text size="sm" fw={mode === 'auto' ? 600 : 400}>
            {t('Auto Select')}
          </Text>
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconHammer size={16} color={mode === 'manual' ? 'var(--mantine-color-orange-6)' : undefined} />
          }
          onClick={() => setMode('manual')}
          bg={mode === 'manual' ? 'var(--mantine-color-orange-light)' : undefined}
        >
          <Text size="sm" fw={mode === 'manual' ? 600 : 400}>
            {t('Manual Selection')}
          </Text>
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconCircleOff
              size={16}
              color={mode === 'disabled' ? 'var(--mantine-color-red-6)' : undefined}
            />
          }
          onClick={() => setMode('disabled')}
          bg={mode === 'disabled' ? 'var(--mantine-color-red-light)' : undefined}
        >
          <Text size="sm" fw={mode === 'disabled' ? 600 : 400}>
            {t('Disabled')}
          </Text>
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>{t('Available Servers')}</Menu.Label>
        <Stack gap={0} mah={300} style={{ overflowY: 'auto' }}>
          {BUILTIN_MCP_SERVERS.map((server) => (
            <ServerItem
              key={server.id}
              item={{
                id: server.id,
                name: server.name,
                enabled: mcp.enabledBuiltinServers.includes(server.id),
              }}
              onEnabledChange={onEnabledChange}
              showTools={mode === 'manual'}
              forcedTools={forcedTools}
              onToggleTool={handleToggleTool}
            />
          ))}
          {mcp.servers.map((server) => (
            <ServerItem
              key={server.id}
              item={server}
              onEnabledChange={onEnabledChange}
              showTools={mode === 'manual'}
              forcedTools={forcedTools}
              onToggleTool={handleToggleTool}
            />
          ))}
        </Stack>

        {!mcp.servers.length && !mcp.enabledBuiltinServers.length && (
          <Group justify="center">
            <Link to="/settings/mcp">
              <Button size="xs" my={12} variant="outline">
                {t('Add your first MCP server')}
              </Button>
            </Link>
          </Group>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}

export default MCPMenu
