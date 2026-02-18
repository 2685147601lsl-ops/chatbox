import { type ProviderModelInfo } from '@shared/types'
import { useMemo } from 'react'

/**
 * ChatboxAI models hook - disabled since we don't use Chatbox AI license.
 * Returns empty model lists. The ChatboxAI provider is still registered
 * but won't have any models available.
 */
const useChatboxAIModels = () => {
  const allChatboxAIModels = useMemo<ProviderModelInfo[]>(() => [], [])
  const chatboxAIModels = useMemo<ProviderModelInfo[]>(() => [], [])

  return { allChatboxAIModels, chatboxAIModels }
}

export default useChatboxAIModels
