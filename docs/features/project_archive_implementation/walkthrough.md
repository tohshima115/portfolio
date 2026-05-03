# Walkthrough - Project Archive Implementation

## Progress
- [x] Install Keystatic & MDX
- [x] Configure `keystatic.config.ts`
- [x] Update `astro.config.mjs`
- [x] Create `src/content/config.ts`
- [x] Create `src/layouts/ProjectLayout.astro` (Fixed CSS import)
- [x] Create content components
  - Refactored to `src/components/pages/works/ProjectDetail/{MetaPanel, TableOfContents}`
  - Refactored to `src/components/pages/home/PrtsInterface`
- [x] Create `src/pages/works/[...slug].astro`
- [x] Add sample content (`swept.mdx`)
- [x] Update README with Keystatic instructions

## Installation
Dependencies added: `@keystatic/astro`, `@keystatic/core`, `@astrojs/mdx`.

## Configuration Files
### keystatic.config.ts
- Created with `projects` collection.

### astro.config.mjs
- Added `mdx()` and `keystatic()` integrations.

## Components Structure
Refactored to follow a feature-based directory structure:

```
src/components/
  pages/
    home/
      PrtsInterface/
        index.tsx
    works/
      ProjectDetail/
        MetaPanel/
          index.tsx
        TableOfContents/
          index.tsx
```

## Component Details
### ProjectLayout.astro
- Imports `../styles/global.css` to ensure Tailwind styles are applied.
- Basic HTML wrapper.

### MetaPanel (index.tsx)
- React component for the left panel.
- Displays project details in a terminal-like style.

### TableOfContents (index.tsx)
- React component for navigation.
- Recieves `headings` prop from Astro MDX render result.

### src/pages/works/[...slug].astro
- Uses `getCollection('projects')`.
- Implements responsive layout using the refactored components.
- Handles MDX content rendering through `<Content />`.

## Verification
1. Restart `pnpm dev`.
2. Visit `http://localhost:4321/works/swept` to see the implemented project detailed page with correct styling.
3. Verify that the layout is responsive and navigation works.
