import { getLicenseKey } from '@/stores/settingActions'
import type { MCPServerConfig } from './types'
import i18n from '@/i18n'

export interface BuildinMCPServerConfig {
  id: string
  name: string
  description: string
  url: string
}

/**
 * 这里的 BUILTIN_MCP_SERVERS 已被清空，你可以根据需要在这里添加你自己的内置 MCP 服务器人选。
 */
export const BUILTIN_MCP_SERVERS: BuildinMCPServerConfig[] = [
  {
    id: '@cherry/time',
    name: 'Time',
    description: 'Get current system time and date',
    url: 'local://cherry/time',
  },
  {
    id: '@cherry/fetch',
    name: 'Fetch',
    description: 'Fetch content from a URL',
    url: 'local://cherry/fetch',
  },
  {
    id: '@cherry/python',
    name: 'Python Interpreter',
    description: 'Execute Python code in a safe sandbox using Pyodide',
    url: 'local://cherry/python',
  },
  {
    id: '@cherry/browser',
    name: 'Web Browser',
    description: 'Control a hidden Electron window via CDP for browsing',
    url: 'local://cherry/browser',
  },
  {
    id: '@cherry/sequentialthinking',
    name: 'Sequential Thinking',
    description: 'Structured thinking process for complex problem solving',
    url: 'local://cherry/sequentialthinking',
  },
]


export function getBuiltinServerConfig(id: string, licenseKey?: string): MCPServerConfig | null {
  const config = BUILTIN_MCP_SERVERS.find((s) => s.id === id)
  if (!config) {
    return null
  }
  const license = licenseKey || getLicenseKey()
  return {
    id,
    name: config.name,
    enabled: true,
    transport: {
      type: 'http',
      url: config.url,
      headers: license ? { 'x-chatbox-license': license } : undefined,
    },
  }
}
