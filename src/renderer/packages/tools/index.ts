import { t } from 'i18next'
import { startCase } from 'lodash'

export function getToolName(toolName: string): string {
  // Use translation keys that i18next cli can detect
  const toolNames: Record<string, string> = {
    query_knowledge_base: t('Query Knowledge Base'),
    get_files_meta: t('Get Files Meta'),
    read_file_chunks: t('Read File Chunks'),
    list_files: t('List Files'),
    web_search: t('Web Search'),
    file_search: t('File Search'),
    code_search: t('Code Search'),
    terminal: t('Terminal'),
    create_file: t('Create File'),
    edit_file: t('Edit File'),
    delete_file: t('Delete File'),
    parse_link: t('Parse Link'),
  }

  // Handle MCP tool names like mcp__server__tool or mcp__tool
  if (toolName.startsWith('mcp__')) {
    const parts = toolName.split('__')
    if (parts.length === 3) {
      // mcp__server__tool -> Server: Tool Name
      const server = parts[1]
      const tool = parts[2]
      return `${startCase(server)}: ${startCase(tool)}`
    }
    if (parts.length === 2) {
      // mcp__tool -> Tool Name
      return startCase(parts[1])
    }
  }

  return toolNames[toolName] || startCase(toolName)
}
