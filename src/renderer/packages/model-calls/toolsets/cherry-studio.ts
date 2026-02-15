
import { tool } from 'ai'
import { z } from 'zod'
import { t } from 'i18next'

const toolSetDescription = `
Use these tools to perform helpful utility tasks like getting the current time/date or fetching content from URLs.

## get_current_time
Get the current system time and date.

## fetch_url
Fetch content from a URL. Can return HTML or JSON.
`

export const getCurrentTimeTool = tool({
    description: 'Get current time and date',
    inputSchema: z.object({}),
    execute: async () => {
        const now = new Date()
        const result = {
            role: 'tool',
            content: now.toLocaleString(),
        }
        return JSON.stringify(result)
    },
})

export const fetchUrlTool = tool({
    description: 'Fetch content from a URL. Returns the response body as text.',
    inputSchema: z.object({
        url: z.string().url().describe('The URL to fetch'),
    }),
    execute: async ({ url }) => {
        try {
            const response = await fetch(url)
            if (!response.ok) {
                return `Error: ${response.status} ${response.statusText}`
            }
            const text = await response.text()
            // Basic truncation to avoid overwhelming context
            if (text.length > 20000) {
                return text.slice(0, 20000) + '... (truncated)'
            }
            return text
        } catch (error) {
            return `Error fetching URL: ${(error as Error).message}`
        }
    },
})

export default {
    description: toolSetDescription,
    tools: {
        get_current_time: getCurrentTimeTool,
        fetch_url: fetchUrlTool,
    },
}
