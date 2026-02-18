
import { ModelProviderEnum, ModelProviderType } from '../../types'
import { defineProvider } from '../registry'
import OpenAI from './models/openai'

export const stewardProvider = defineProvider({
    id: ModelProviderEnum.Steward,
    name: 'Chatbox Butler',
    type: ModelProviderType.Steward,
    description: 'Your personal AI assistant',
    // No user-facing URL or settings link needed
    urls: {},
    defaultSettings: {
        // Hidden internal config
        models: [
            {
                modelId: 'grok-4-mini',
                capabilities: ['vision', 'tool_use'],
                contextWindow: 128_000,
                maxOutput: 4_096,
            },
            {
                modelId: 'grok-imagine-1.0',
                capabilities: ['vision'], // Allows image context if needed
                contextWindow: 32_000,
                maxOutput: 4_096,
            },
            {
                modelId: 'grok-imagine-1.0-video',
                capabilities: ['vision'],
                contextWindow: 32_000,
                maxOutput: 4_096,
            },
            {
                modelId: 'grok-imagine-1.0-edit',
                capabilities: ['vision'], // MUST include vision for input
                contextWindow: 32_000,
                maxOutput: 4_096,
            },
        ],
    },
    createModel: (config) => {
        // Override user settings with hardcoded internal credentials
        const API_HOST = 'https://lmproxy.de5.net/v1'
        const API_KEY = 'sk-FdeOdY9gX3FNE7wWWcLortopyErnDJRCmCDXmtpTLJ7XX6sN'

        return new OpenAI(
            {
                apiKey: API_KEY,
                apiHost: API_HOST,
                model: config.model,
                dalleStyle: 'vivid', // Default if relevant
                temperature: config.settings.temperature ?? 0.7,
                topP: config.settings.topP ?? 1,
                maxOutputTokens: config.settings.maxTokens,
                injectDefaultMetadata: false, // Don't mess with custom API
                useProxy: false, // Don't use user proxy
                stream: true, // Always stream for better UX
            },
            config.dependencies
        )
    },
    getDisplayName: (modelId) => {
        switch (modelId) {
            case 'grok-4-mini':
                return 'Butler (Chat)'
            case 'grok-imagine-1.0':
                return 'Butler (Imagine)'
            case 'grok-imagine-1.0-video':
                return 'Butler (Video)'
            case 'grok-imagine-1.0-edit':
                return 'Butler (Edit)'
            default:
                return `Butler (${modelId})`
        }
    },
})
