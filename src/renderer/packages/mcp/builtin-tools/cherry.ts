import { tool } from 'ai'
import { z } from 'zod'

// --- @cherry/time ---
export const timeTool = tool({
    description: 'Get current system time and date',
    inputSchema: z.object({}),
    execute: async () => {
        return new Date().toLocaleString()
    },
})

// --- @cherry/fetch ---
export const fetchTool = tool({
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
            if (text.length > 20000) {
                return text.slice(0, 20000) + '... (truncated)'
            }
            return text
        } catch (error) {
            return `Error fetching URL: ${(error as Error).message}`
        }
    },
})

// --- @cherry/sequentialthinking ---
interface ThoughtData {
    thought: string
    thoughtNumber: number
    totalThoughts: number
    isRevision?: boolean
    revisesThought?: number
    branchFromThought?: number
    branchId?: string
    nextThoughtNeeded: boolean
}

let thoughtHistory: ThoughtData[] = []

export const sequentialThinkingTool = tool({
    description: `A detailed tool for dynamic and reflective problem-solving through thoughts. 
Each thought can build on, question, or revise previous insights.`,
    inputSchema: z.object({
        thought: z.string().describe('Your current thinking step'),
        nextThoughtNeeded: z.boolean().describe('Whether another thought step is needed'),
        thoughtNumber: z.number().int().min(1).describe('Current thought number'),
        totalThoughts: z.number().int().min(1).describe('Estimated total thoughts needed'),
        isRevision: z.boolean().optional().describe('Whether this revises previous thinking'),
        revisesThought: z.number().int().min(1).optional().describe('Which thought is being reconsidered'),
        branchFromThought: z.number().int().min(1).optional().describe('Branching point thought number'),
        branchId: z.string().optional().describe('Branch identifier'),
    }),
    execute: async (args) => {
        thoughtHistory.push(args)
        return JSON.stringify({
            status: 'success',
            thoughtNumber: args.thoughtNumber,
            totalThoughts: args.totalThoughts,
            nextThoughtNeeded: args.nextThoughtNeeded,
            historyLength: thoughtHistory.length,
        })
    },
})

// --- @cherry/python ---
export const pythonTool = tool({
    description: 'Execute Python code using Pyodide in a sandboxed environment.',
    inputSchema: z.object({
        code: z.string().describe('The Python code to execute'),
    }),
    execute: async ({ code }) => {
        try {
            // In a real implementation, we would load pyodide here if not already loaded.
            // For now, let's provide a mock or simple implementation.
            return `Python execution result (Mock): Successfully executed code of length ${code.length}. \n(Note: Pyodide integration pending)`
        } catch (error) {
            return `Python Error: ${(error as Error).message}`
        }
    },
})

// --- @cherry/browser ---
export const browserTool = tool({
    description: 'Control a hidden Electron window via CDP for browsing.',
    inputSchema: z.object({
        url: z.string().url().describe('The URL to open'),
        action: z.enum(['open', 'js', 'reset']).default('open'),
        script: z.string().optional().describe('JS script to execute'),
    }),
    execute: async ({ url, action }) => {
        return `Browser result (Mock): ${action} ${url} in hidden window. \n(Note: Electron main process integration required for full functionality)`
    },
})

export const cherryBuiltinTools: Record<string, any> = {
    '@cherry/time': { get_current_time: timeTool },
    '@cherry/fetch': { fetch_url: fetchTool },
    '@cherry/sequentialthinking': { sequentialthinking: sequentialThinkingTool },
    '@cherry/python': { python_execute: pythonTool },
    '@cherry/browser': { browser_control: browserTool },
}
