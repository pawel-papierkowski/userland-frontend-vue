# Vue 3 Frontend Project Instructions

## Tech Stack & Architecture
- **Framework:** Vue 3 using the Composition API exclusively. 
- **Script Setup:** Always use `<script setup>` syntax for components. Do NOT use the Options API or standard `setup()` functions.
- **State Management:** Use Pinia for state management. Avoid using provide/inject unless strictly necessary for component library development.
- **Routing:** Use Vue Router 4. Always use Named Routes when navigating programmatically or using `<router-link>`.

## Development Guidelines
- **Comments:** Preserve comments or update them whenever possible. New code must be properly commented.
- **Component Naming:** Use PascalCase for component filenames (e.g., `UserProfile.vue`) and when importing them.
- **Imports:** Use `@` when importing classes, types etc.
- **Styling:** Use `<style scoped>` for component-specific CSS.
- **Types:** We use TypeScript. Use semicolons.
- **Placement:**
  - Pure code is in `src/code`.
  - Components are in `src/components`.
  - Language files are in `src/locales`.
  - Routing is in `src/router`.
  - API calls via Axios are in `src/services`.
  - Pinia state management is in `src/stores`.
  - Global styles are in `src/styles`.

## Available Scripts & Commands
- **Run dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Linting:** `npm run lint`
- **Formatting:** `npm run format` (using Prettier)
- **Run all tests:** `npm run test:ci`

## Testing
- We use **Vitest** for unit testing and **Cypress** for end-to-end testing.
- Run tests using `npm run test:ci`.
- Tests are NOT co-located. We have mirror directory structure in separate `src/__tests__/` directory.
- Always comment tests well, marking arrange, act and assert sections and summarizing what they do.

## Other
- When you provide code listings or examples, do not print line numbers.

## Project Specific Rules
- **API Calls:** All API calls must be placed in the `src/services/` directory, never directly inside a `.vue` component.