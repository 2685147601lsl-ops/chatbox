---
name: TypeScript React
description: TypeScript React best practices and patterns
---
# TypeScript React Guidelines

TypeScript React best practices and patterns.

## Best Practices

1.  **Prefer Functional Components**: Use `React.FC` or simple functional components with typed props.
2.  **Hooks**: Utilize `useState` and `useEffect` hooks for state and side effects.
3.  **Strict Typing**: Implement proper TypeScript interfaces for props and state. Avoid `any`.
4.  **Performance**: Use `React.memo` for performance optimization when needed.
5.  **Custom Hooks**: Implement custom hooks for reusable logic.
6.  **Strict Mode**: Utilize TypeScript's strict mode.

## Folder Structure

```
src/
  components/
  hooks/
  pages/
  types/
  utils/
  App.tsx
  index.tsx
```

## Additional Instructions

1.  Use `.tsx` extension for files with JSX.
2.  Implement strict TypeScript checks.
3.  Utilize `React.lazy` and `Suspense` for code-splitting.
4.  Use type inference where possible.
5.  Implement error boundaries for robust error handling.
6.  Follow React and TypeScript best practices and naming conventions.
7.  Use ESLint with TypeScript and React plugins for code quality.
