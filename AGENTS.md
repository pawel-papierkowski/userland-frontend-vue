# Vue 3 Frontend Project Instructions

## Tech Stack & Architecture
- **Framework:** Vue 3 using the Composition API exclusively. 
- **Script Setup:** Always use `<script setup>` syntax for components. Do NOT use the Options API or standard `setup()` functions.
- **State Management:** Use Pinia for state management. Avoid using provide/inject unless strictly necessary for component library development.
- **Routing:** Use Vue Router 4. Always use Named Routes when navigating programmatically or using `<router-link>`.

## Development Guidelines
- **Component Naming:** Use PascalCase for component filenames (e.g., `UserProfile.vue`) and when importing them.
- **Imports:** Use `@` when importing classes, types etc.
- **Styling:** Use `<style scoped>` for component-specific CSS.
- **Types:** We use TypeScript.
- **Placement:**
  - Global styles are in `src/styles`.
  - Pure code is in `src/code`.
  - Components are in `src/components`.
  - Language files are in `src/locales`.

## Available Scripts & Commands
- **Run dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Linting:** `npm run lint`
- **Formatting:** `npm run format` (using Prettier)

## Testing
- We use Vitest for unit testing.
- Run tests using `npm run test:unit`.
- We have mirror directory structure in separate `src/__tests__/` directory.

## Project Specific Rules
- **API Calls:** All API calls must be placed in the `src/services/` directory, never directly inside a `.vue` component.