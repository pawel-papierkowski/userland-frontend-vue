# Vue 3 Frontend Project Instructions

UserLand is portfolio project for frontend in Vue.

## Tech Stack & Architecture
- **Framework:** Vue 3 using the Composition API exclusively. 
- **Script Setup:** Always use `<script setup>` syntax for components. Do NOT use the Options API or standard `setup()` functions.
- **State Management:** Use Pinia for state management. Avoid using provide/inject unless strictly necessary for component library development.
- **Routing:** Use Vue Router 4. Always use Named Routes when navigating programmatically or using `<router-link>`.

## Development Guidelines
- **Modifications:**
  - Do NOT change things that are not related to your task. If it is neccessary for some reason, ask first. Focus on your task unless you are explicitly told you are allowed to make other changes in code.
  - If new language keys and translations are needed, always add them for all available languages, even for texts that are used only in tests for consistency. File structure (directories, file names and language keys in files) must be identical for all languages.
- **Comments:**
  - Preserve comments or update them whenever possible. New code must be properly commented.
  - Provide @param and @returns where appropriate.
- **Naming:** Use PascalCase for component filenames and classes (e.g., `UserProfile.vue`) and when importing them.
- **Imports:** Use `@` when importing classes, types etc. Typescript files must end in `.ts`.
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
- **Custom components:**:
  - Must support ARIA where applicable.
  - Must support keyboard where applicable.

## Available Scripts & Commands
- **Run dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Linting:** `npm run lint`
- **Formatting:** `npm run format` (using Prettier)
- **Run all tests:** `npm run test:ci`

## Reviewing code
When I ask for review, in order of importance:
- Analyze general purpose and functionality.
- Check code for bugs, mistakes and other potential issues. If there are a lot of stuff here, skip rest of steps - we need to fix that stuff first.
- Verify algorithm and logic. Is this correct way to do it? Can it be done better?
- Find tests for reviewed code and review them too. If tests are missing, note their absence and plan what tests should be added. Do not add them automatically unless explicitly asked.
- I might ask to review same code multiple times (to re-check code after changes implemented from previous review). Re-read files as neccessary.
  - You can skip some steps if appropriate (for example, skip purpose/functionality analysis if purpose and functionality is already known).
  - If previously reported issues still exist, inform about them again unless they were explained or rejected.

## Testing
- We use **Vitest** for unit testing and **Cypress** for end-to-end testing.
- Run tests using `npm run test:ci`.
- Tests are NOT co-located. We have mirror directory structure in separate `src/__tests__/` directory. Test files have `.spec.ts` at end of their names.
- Use test suites.
- Always comment tests well, marking arrange, act and assert sections and summarizing what they do.
- When you add `vi.fn()`, you forget to add type parameter and IDE throws a fit. Always add appropriate type parameter.

### Style of test code

Style of code block:
// ////////////////////////////////////////////////////////////////////////////
// Name of block

Note: if intended, length of comment must be adjusted so it always ends at 80th col.

## Other Rules
- **API Calls:** All API calls must be placed in the `src/services/` directory, never directly inside a `.vue` component.
