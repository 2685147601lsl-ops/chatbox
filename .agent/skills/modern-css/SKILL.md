---
name: Modern CSS & Design
description: Modern CSS techniques and design system implementation
---

# Modern CSS & Design

This skill provides guidelines for implementing modern, responsive, and beautiful UI designs.

## Core Principles

### 1. Variables & Design Tokens
Always use CSS Variables (Custom Properties) for design tokens (colors, valid spacing, typography, etc.) to ensure consistency and easy theme changes.

```css
:root {
  --color-primary: #3498db;
  --color-secondary: #2ecc71;
  --spacing-unit: 8px;
  --font-family-base: 'Inter', sans-serif;
}

.button {
  background-color: var(--color-primary);
  padding: calc(var(--spacing-unit) * 1.5);
  font-family: var(--font-family-base);
}
```

### 2. Layouts: Flexbox & Grid
- **Flexbox**: Use for 1D layouts (alignment, distribution along an axis).
  ```css
  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  ```
- **Grid**: Use for 2D layouts (rows AND columns).
  ```css
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-unit);
  }
  ```

### 3. Responsive Design
- Use `rem` and `em` units instead of `px` where appropriate for scalability.
- Implement mobile-first media queries.
  ```css
  /* Mobile first styles */
  .card { width: 100%; }

  /* Adjust for tablet */
  @media (min-width: 768px) {
    .card { width: 48%; }
  }

  /* Adjust for desktop */
  @media (min-width: 1024px) {
    .card { width: 30%; }
  }
  ```

### 4. Accessibility (A11y)
- Ensure sufficient color contrast.
- Use `focus-visible` for keyboard navigation styles.
- Avoid removing outline unless providing a custom focus style.
- Use semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<dialog>`, etc.).

### 5. Advanced Techniques
- **CSS Transitions & Animations**: Use `transform` and `opacity` for performance-friendly animations; avoid animating layout properties like `height` or `width`.
- **Custom Scrollbars**: Style scrollbars to match the application theme.
  ```css
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--color-primary);
    border-radius: 4px;
  }
  ```

## Checklist
- [ ] Are CSS variables used for theme values?
- [ ] Is layout responsive across devices?
- [ ] Are semantic HTML tags used?
- [ ] Are animations performant (using `transform`/`opacity`)?
