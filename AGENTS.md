# Vue 3 Frontend Project Instructions

UserLand is portfolio project for frontend in Vue. It is part of bigger project that contains frontend and backend.

## Tech Stack & Architecture
- **Framework:** Vue 3 using the Composition API exclusively. 
- **Script Setup:** Always use `<script setup>` syntax for components. Do NOT use the Options API or standard `setup()` functions.
- **State Management:** Use Pinia for state management. Avoid using provide/inject unless strictly necessary for component library development.
- **Routing:** Use Vue Router 4. Always use Named Routes when navigating programmatically or using `<router-link>`.

## Development Guidelines

### General
- **Types:** We use TypeScript. Use semicolons.
- **Placement:**
  - Pure code is in `src/code`.
  - Components are in `src/components`.
  - Language files are in `src/locales`.
  - Routing is in `src/router`.
  - API calls via Axios are in `src/services`.
  - Pinia state management is in `src/stores`.
  - Global styles are in `src/styles`.
- **Modifications:**
  - Do NOT change things that are not related to your task. If it is neccessary for some reason, ask first. Focus on your task unless you are explicitly told you are allowed to make other changes in code.
  - Do NOT install npm modules, unless explicitly asked. If you think installing new module is necessary, explain what module is needed and why.
- **Comments:**
  - Preserve comments or update them whenever possible. New code must be properly commented.
  - Provide `@param` and `@returns` where appropriate.
- **Naming:** Use PascalCase for component filenames and classes (e.g., `UserProfile.vue`) and when importing them.
- **Imports:** Use `@` when importing classes, types etc. Typescript files must end in `.ts`.
- **Styling:** Use `<style scoped>` for component-specific CSS.

### Specific issues
- **Data:**
  - When dealing with local storage, add/use constants from `/code/data/app/storage.ts`.
- **Language files:**
  - This project uses multiple languages.
  - Languages are in `/src/locales`. Each language has its own subdirectory (name is code of language, for example `/en` subdirectory for English).
  - File structure (directories, file names and language keys in files) must be identical for all languages. Only difference is translation strings.
  - Emojis cannot be inserted by AI unless explicitly allowed. Existing emojis are ok.
  - If new language keys and translations are needed, always add them for all available languages (even for texts that are used only in tests) for consistency.
- **Custom components:**:
  - Must support ARIA where applicable.
  - Must support keyboard navigation inside component where applicable.
  - Must support tabbing into component and `<label>` clicking (usually via hidden `<button>`, as `<div>` is not labelable) where applicable. Tests for these two features must use mount with multiple components (like paired label and tested component itself) whenever possible. See relevant tests in `ComboBox.spec.ts` for how to do it.

## Available Scripts & Commands
- **Run dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Linting:** `npm run lint`
- **Formatting:** `npm run format` (using Prettier)
- **Run all CI tests:** `npm run test:ci`
- **Run E2E tests (headless/CI):** `npm run test:e2e`
- **Run E2E tests for single file (headless/CI):** `npm run test:e2e:one -- path/to/file.cy.ts`
- **Run E2E tests (interactive):** `npm run test:e2e:dev`

## Reviewing code

### General
When I ask for review, in order of importance:
- Analyze general purpose and functionality.
- Check code for bugs, mistakes and other potential issues. If there are a lot of stuff here, skip rest of steps: we need to fix that stuff first.
- Verify algorithm and logic. Is this correct way to do it? Can it be done better?
- Find tests for reviewed code and review them too. If tests are missing, note their absence and plan what tests should be added. Do not add them automatically unless explicitly asked.
- I might ask to review same code multiple times (to re-check code after changes implemented from previous review). Re-read files as neccessary.
  - You can skip some steps if appropriate (for example, skip purpose/functionality analysis if purpose and functionality is already known).
  - If previously reported issues still exist, inform about them again unless they were explained or rejected.

### Code review rules
- Project uses `v-html` in certain places. Only static translation keys or static strings are allowed (safe to use).

## Testing
We use **Vitest** for unit testing and **Cypress** for end-to-end testing.

### Vitest
- Tests are NOT co-located. We have mirror directory structure in separate `src/__tests__/` directory. Test files have `.spec.ts` at end of their names.
- Use test suites.
- Always comment tests well, marking arrange, act and assert sections and summarizing what they do.
- When you add `vi.fn()`, you need to add appropriate type parameter, for example `vi.fn<() => void>()`.
- When testing changes/fixes to code/components, run only relevant tests (`.spec.ts` file or even only single relevant test).
- Run all tests using `npm run test:ci` when you need to verify everything works after you finish your task.

### Cypress E2E
- General
  - Everything related to Cypress is in `cypress` directory.
  - Tests must be independent (runnable in any order).
  - Use `beforeEach()` for common setup (visit page, intercept API calls, login etc).
  - Use `cy.intercept()` to stub API calls instead of relying on a live backend.
  - Use custom commands like `cy.getByTestId()`.
- Execution of tests
  - To run test for single file: `npm run test:e2e:one -- path/to/file.cy.ts`. Use it when working on current Cypress-related task like creating tests. Keep in mind this command does not rebuild. If you made changes in code, run rebuild separately before running test file.
  - To run all tests: `npm run test:e2e`. Use it only at end to verify everything still works after all changes.
- Page Object Model (POM)
  - Use Page Object Model.
  - POM files are in `cypress/support/pages` and use PascalCase. Example: `UserRegistrationPage.ts`.
  - Separate `General`, `Get elements` and `Execute actions` sections. See `LoginPage.ts` for example.
- Conventions
  - In imports use `@`. Example: `import RegistrationPage from '@/../cypress/support/pages/standard/RegistrationPage.ts'`;
  - Use `cy.ts` suffix and kebab-case convention for test file naming. Example: `file-name.cy.ts`.
  - Directory structure inside `cypress/e2e` should follow route groups (by page/feature).
  - Use `data-testid` selector. Use `cy.getByTestId()` custom command to select elements (shorthand for `[data-testid]` attribute).
- Other
  - Do not chain `cy` commands.
  - Add new `data-testid` attributes if missing and needed. Separate testid sections with `_`. Example: `login_btn_submit`.

### Style of test code

Style of code block:
// ////////////////////////////////////////////////////////////////////////////
// Name of block

Note: if indented, length of comment must be adjusted so it always ends at 80th col.

## Other Rules
- **API Calls:** All API calls must be placed in the `src/services/` directory, never directly inside a `.vue` component.
