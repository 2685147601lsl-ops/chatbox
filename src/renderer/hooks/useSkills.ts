import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AgentSkill } from '@shared/types/skills'

export type { AgentSkill }

export const useSkills = () => {
    const queryClient = useQueryClient()

    const { data: skills = [], isLoading } = useQuery({
        queryKey: ['agent-skills'],
        queryFn: async () => {
            // @ts-ignore
            const result = await window.electronAPI?.invoke('skills:list')
            return (result || []) as AgentSkill[]
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Mutation to save a skill
    const saveSkill = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            // @ts-ignore
            await window.electronAPI?.invoke('skills:save', { id, content })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-skills'] })
        },
    })

    // Mutation to delete a skill
    const deleteSkill = useMutation({
        mutationFn: async (id: string) => {
            // @ts-ignore
            await window.electronAPI?.invoke('skills:delete', id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-skills'] })
        },
    })

    return {
        skills,
        isLoading,
        saveSkill,
        deleteSkill,
    }
}
