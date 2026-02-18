import { ActionIcon, Box, Button, Card, Group, Modal, Stack, Text, Textarea, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSkills, AgentSkill } from '@/hooks/useSkills'
import { ScalableIcon } from '@/components/common/ScalableIcon'

export const Route = createFileRoute('/settings/skills')({
    component: RouteComponent,
})

export function RouteComponent() {
    const { t } = useTranslation()
    const { skills, saveSkill, deleteSkill } = useSkills()
    const [opened, setOpened] = useState(false)
    const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null)

    const form = useForm({
        initialValues: {
            id: '',
            name: '',
            description: '',
            content: '',
        },
        validate: {
            id: (value) => (/^[a-z0-9-]+$/.test(value) ? null : 'ID must be kebab-case (a-z, 0-9, -)'),
            name: (value) => (value ? null : 'Name is required'),
            content: (value) => (value ? null : 'Content is required'),
        },
    })

    const handleEdit = (skill: AgentSkill) => {
        setEditingSkill(skill)
        form.setValues({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            content: skill.content,
        })
        setOpened(true)
    }

    const handleCreate = () => {
        setEditingSkill(null)
        form.reset()
        form.setValues({
            id: '',
            name: '',
            description: '',
            content: `---
name: New Skill
description: Description of the skill
---
# New Skill

Instructions for the skill...
`
        })
        setOpened(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm(t('Are you sure you want to delete this skill?'))) {
            await deleteSkill.mutateAsync(id)
        }
    }

    const handleSubmit = async (values: typeof form.values) => {
        // If we are editing, we keep the ID. If creating, we use the ID from form.
        // However, if editing, we might update the content which includes frontmatter.
        // The main process updates the file processing ID.

        // Ensure content has frontmatter matching form values if possible, 
        // but the user might have edited the content directly.
        // We trust the content field primarily.

        await saveSkill.mutateAsync({
            id: values.id,
            content: values.content
        })
        setOpened(false)
    }

    return (
        <Box p="md">
            <Group justify="space-between" mb="lg">
                <Title order={5}>{t('Agent Skills')}</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
                    {t('Add Skill')}
                </Button>
            </Group>

            <Stack>
                {skills.map((skill) => (
                    <Card key={skill.id} withBorder padding="sm" radius="md">
                        <Group justify="space-between" align="start">
                            <Box style={{ flex: 1 }}>
                                <Group gap="xs" mb={4}>
                                    <Text fw={600}>{skill.name}</Text>
                                    <Text size="xs" c="dimmed" ff="monospace" bg="var(--mantine-color-gray-1)" px={4} py={2} style={{ borderRadius: 4 }}>
                                        {skill.id}
                                    </Text>
                                </Group>
                                <Text size="sm" c="dimmed" lineClamp={2}>
                                    {skill.description}
                                </Text>
                            </Box>
                            <Group gap="xs">
                                <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(skill)}>
                                    <IconEdit size={18} />
                                </ActionIcon>
                                <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(skill.id)}>
                                    <IconTrash size={18} />
                                </ActionIcon>
                            </Group>
                        </Group>
                    </Card>
                ))}
                {skills.length === 0 && (
                    <Text c="dimmed" ta="center" py="xl">
                        {t('No skills found. Create one to get started.')}
                    </Text>
                )}
            </Stack>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={editingSkill ? t('Edit Skill') : t('Create Skill')}
                size="lg"
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        <TextInput
                            label={t('ID (Directory Name)')}
                            description={t('Used for folder name. Cannot be changed once created.')}
                            placeholder="my-skill-name"
                            disabled={!!editingSkill}
                            required
                            {...form.getInputProps('id')}
                        />
                        {/* Name and Description are parsed from content, but we can show them for reference or help generate content */}

                        <Textarea
                            label={t('Skill Content (SKILL.md)')}
                            description={t('Define your skill using Markdown and YAML frontmatter.')}
                            autosize
                            minRows={10}
                            maxRows={20}
                            required
                            styles={{ input: { fontFamily: 'monospace' } }}
                            {...form.getInputProps('content')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={() => setOpened(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" loading={saveSkill.isPending}>
                                {t('Save')}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Box>
    )
}


