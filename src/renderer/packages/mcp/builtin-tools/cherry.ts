import { tool } from 'ai'
import { z } from 'zod'
import { fetchWithProxy } from '@/utils/request'

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
            const response = await fetchWithProxy(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            })
            const text = await response.text()
            if (text.length > 50000) {
                return text.slice(0, 50000) + '... (truncated)'
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
let pyodideInstance: any = null
async function getPyodide() {
    if (pyodideInstance) return pyodideInstance
    if (!(window as any).loadPyodide) {
        // Load dynamically if not present
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js'
        document.head.appendChild(script)
        await new Promise((resolve) => { script.onload = resolve })
    }
    pyodideInstance = await (window as any).loadPyodide()
    return pyodideInstance
}

export const pythonTool = tool({
    description: 'Execute Python code using Pyodide in a sandboxed environment.',
    inputSchema: z.object({
        code: z.string().describe('The Python code to execute'),
    }),
    execute: async ({ code }) => {
        try {
            const pyodide = await getPyodide()
            // Capture stdout
            pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
`)
            await pyodide.runPythonAsync(code)
            const stdout = pyodide.runPython('sys.stdout.getvalue()')
            return stdout || 'Execution successful (no output)'
        } catch (error) {
            return `Python Error: ${(error as Error).message}`
        }
    },
})

// --- @cherry/browser ---
export const browserTool = tool({
    description: 'Control a hidden Electron window for browsing. Best for JavaScript-heavy sites.',
    inputSchema: z.object({
        url: z.string().url().describe('The URL to open'),
        action: z.enum(['open', 'js', 'reset']).default('open'),
        script: z.string().optional().describe('JS script to execute'),
    }),
    execute: async ({ url, action, script }) => {
        // Desktop Electron environment check
        if (typeof (window as any).electronAPI?.invoke === 'function') {
            return await (window as any).electronAPI.invoke('mcp:browser:control', { url, action, script })
        }

        // Fallback for non-desktop or browser-based dev env
        const note = '(Note: You are currently not in the Desktop App environment. The advanced browser tool with JS rendering is unavailable. Falling back to basic content fetching...)\n\n'
        try {
            const response = await fetchWithProxy(url)
            const text = await response.text()
            return note + (text.slice(0, 20000) + (text.length > 20000 ? '... (truncated)' : ''))
        } catch (error) {
            return note + `Fallback fetch failed: ${(error as Error).message}`
        }
    },
})

export const cherryBuiltinTools: Record<string, any> = {
    '@cherry/time': { get_current_time: timeTool },
    '@cherry/fetch': { fetch_url: fetchTool },
    '@cherry/sequentialthinking': { sequentialthinking: sequentialThinkingTool },
    '@cherry/python': { python_execute: pythonTool },
    '@cherry/browser': { browser_control: browserTool },
}
