import { ActionIcon, Badge, Checkbox, Flex, Group, Menu, Stack, Text, Tooltip } from '@mantine/core'
import { IconBook, IconSettings2 } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { type FC, type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSkills } from '@/hooks/useSkills'
import { navigateToSettings } from '@/modals/Settings'
import { uiStore, useUIStore } from '@/stores/uiStore'
import { ScalableIcon } from '../common/ScalableIcon'

const EMPTY_ARRAY: string[] = []

const SkillsMenu: FC<{ sessionId?: string; children: (enabledSkillsCount: number) => ReactNode }> = ({
    sessionId = 'new',
    children,
}) => {
    const { t } = useTranslation()
    const { skills } = useSkills()
    const enabledSkills = useUIStore((s) => s.inputBoxSkillsMap[sessionId]) || EMPTY_ARRAY
    const [opened, setOpened] = useState(false)

    const setEnabledSkills = (nextSkills: string[]) =>
        uiStore.getState().setInputBoxSkills(sessionId, nextSkills)

    const handleToggleSkill = (skillId: string) => {
        if (enabledSkills.includes(skillId)) {
            setEnabledSkills(enabledSkills.filter((id) => id !== skillId))
        } else {
            setEnabledSkills([...enabledSkills, skillId])
        }
    }

    return (
        <Menu
            opened={opened}
            onChange={setOpened}
            shadow="md"
            withArrow
            width={280}
            closeOnItemClick={false}
            position="top-start"
            transitionProps={{
                transition: 'pop',
                duration: 200,
            }}
        >
            <Menu.Target>{children(enabledSkills.length)}</Menu.Target>
            <Menu.Dropdown p={8}>
                <Flex justify="space-between" align="center" mb={4}>
                    <Group gap={8}>
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts="1px">
                            Agent Skills
                        </Text>
                        {enabledSkills.length > 0 && (
                            <Badge size="xs" variant="light" color="blue">
                                {enabledSkills.length} Active
                            </Badge>
                        )}
                    </Group>
                    <ActionIcon
                        variant="subtle"
                        size={20}
                        onClick={() => {
                            setOpened(false)
                            navigateToSettings('/skills')
                        }}
                    >
                        <ScalableIcon icon={IconSettings2} size={14} color="var(--chatbox-tint-tertiary)" />
                    </ActionIcon>
                </Flex>

                <Menu.Divider />

                <Menu.Label>{t('Available Skills')}</Menu.Label>
                {skills.length === 0 ? (
                    <Text size="sm" c="dimmed" px="xs" py="xs" ta="center">
                        {t('No skills available')}
                    </Text>
                ) : (
                    <Stack gap={2}>
                        {skills.map((skill) => (
                            <Menu.Item
                                key={skill.id}
                                onClick={() => handleToggleSkill(skill.id)}
                                leftSection={
                                    <Checkbox
                                        size="xs"
                                        checked={enabledSkills.includes(skill.id)}
                                        readOnly
                                        styles={{ input: { cursor: 'pointer' } }}
                                    />
                                }
                            >
                                <Stack gap={0}>
                                    <Text size="sm" fw={500}>
                                        {skill.name}
                                    </Text>
                                    {skill.description && (
                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                            {skill.description}
                                        </Text>
                                    )}
                                </Stack>
                            </Menu.Item>
                        ))}
                    </Stack>
                )}
            </Menu.Dropdown>
        </Menu>
    )
}

export default SkillsMenu
