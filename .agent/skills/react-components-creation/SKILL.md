---
name: React Component Creation
description: Best practices for creating React components
---
# React Component Creation Guidelines

This skill encapsulates best practices for creating React components in this project, ensuring consistency, performance, and maintainability.

## Core Principles

1.  **Functional Components**: Always use functional components with hooks. Avoid class components.
2.  **Typescript**: All components must be written in TypeScript (`.tsx`). Props must be explicitly typed using `interface` or `type`.
3.  **Folder Structure**:
    -   Place shared components in `src/renderer/components`.
    -   Place page-specific components in `src/renderer/routes/<route-name>/_components`.
    -   Complex components should have their own folder with an `index.tsx` (or `ComponentName.tsx` re-exported).

## Styling

-   Use **Mantine UI** components as the primary building blocks (`@mantine/core`).
-   Use **Tailwind CSS** for layout and custom styling overrides (`className="flex ..."`).
-   Avoid inline styles (`style={{ ... }}`) unless dynamic values are strictly necessary.
-   Use `clsx` or `classnames` for conditional class logic.

## Hook Usage

-   **Custom Hooks**: Extract reusable logic into custom hooks in `src/renderer/hooks`.
-   **State Management**:
    -   Use `useState` for local UI state.
    -   Use `zustand` (via `useUIStore`, `useSettingsStore`) for global app state.
    -   Use `useQuery` / `tanstack-query` for data fetching.

## Performance Optimization

-   Use `memo` for pure components that re-render often with the same props.
-   Use `useMemo` for expensive calculations.
-   Use `useCallback` for functions passed as props to memoized children.

## Example Component Structure

```tsx
import { Box, Button, Text } from '@mantine/core';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface MyComponentProps {
  title: string;
  isActive?: boolean;
  onAction: () => void;
}

export const MyComponent = ({ title, isActive, onAction }: MyComponentProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      await onAction();
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  return (
    <Box className={clsx('p-4 rounded-md', isActive ? 'bg-blue-50' : 'bg-white')}>
      <Text fw={500}>{title}</Text>
      <Button onClick={handleClick} loading={loading} mt="sm">
        {t('Confirm')}
      </Button>
    </Box>
  );
};
```
