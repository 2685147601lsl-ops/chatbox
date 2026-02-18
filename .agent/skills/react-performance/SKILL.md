---
name: React Performance Optimization
description: Best practices for optimizing React application performance
---

# React Performance Optimization

This skill provides guidelines and patterns for optimizing the performance of React applications.

## Key Concepts

### 1. Memoization
- **React.memo**: Use `React.memo` for functional components to prevent unnecessary re-renders when props haven't changed.
  ```tsx
  const MyComponent = React.memo(({ data }) => {
    return <div>{data}</div>;
  });
  ```
- **useMemo**: Cache expensive calculations.
  ```tsx
  const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
  ```
- **useCallback**: Memoize functions to maintain stable references, especially when passing functions as props to memoized child components.
  ```tsx
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);
  ```

### 2. Virtualization
- Use virtualization libraries like `react-window` or `react-virtualized` for rendering large lists or grids. This ensures only the visible items are rendered in the DOM.

### 3. Code Splitting & Lazy Loading
- **React.lazy & Suspense**: Split your code into smaller chunks and load components only when they are needed.
  ```tsx
  const OtherComponent = React.lazy(() => import('./OtherComponent'));

  function MyComponent() {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <OtherComponent />
      </Suspense>
    );
  }
  ```

### 4. State Management Optimization
- **Colocate State**: Keep state as close as possible to where it's used. Avoid lifting state too high if it affects many unrelated components.
- **Context Pitfalls**: Be cautious with Context API. Updates to Context triggers re-renders in all consumers. Split context into smaller contexts if necessary.

### 5. Interaction to Next Paint (INP)
- Keep event handlers lightweight.
- Use `useTransition` for non-urgent state updates to keep the UI responsive.

## Checklist
- [ ] Are expensive calculations memoized?
- [ ] Are list items utilizing stable keys (not array index)?
- [ ] Is virtualization used for long lists?
- [ ] Are large components lazy loaded?
- [ ] Is the network waterfall minimized?
