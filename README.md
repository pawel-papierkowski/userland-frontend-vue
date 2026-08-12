# UserLand Frontend Vue

This project is *frontend* part of **UserLand system**, designed to work with backend project `userland-backend-java`.

Project is finished.

## Basic info

Author: **Paweł Papierkowski**

Date: **2026**

Used IDE: **Visual Studio Code**

- Webpage address:
  - User website: https://pawelpapierkowski.net.pl/userland-frontend-vue
  - Admin panel: https://pawelpapierkowski.net.pl/userland-frontend-vue/admin
- Locally run Vue server:
  - User website: http://localhost:5173/
  - Admin panel: http://localhost:5173/admin
- Link to source code: https://github.com/pawel-papierkowski/userland-frontend-vue

### Security

This project has measures to mitigate npm supply chain attacks:
- `.npmrc` configuration like using exact versions for `npm ci` or not using freshly released package versions.
- `ci.yml` that runs lockfile integrity verification, `npm audit` and `check-lockfile.mjs` (verifies package hashes, validates lockfile and new install scripts).

Security notes:
- JWT is in localStorage: XSS could cause token leak. Standard SPA trade-off, acceptable.
- Token in URL query string: can leak via browser history. Tokens expire and are single use - enforced by backend.

## Functionality

This project fully manages user on frontend side.

### Features
- Has publicly available user website and admin panel.
- Access is controlled by permissions encoded in JWT. Backend verifies and enforces access.
- Support for multiple languages.
- Show nice error messages from backend endpoints leveraging Problem Details.

### Pages

Frontend is split into two parts: **user website** and **admin panel**. Website as a whole is Single Page Application (SPA).

- **User website**: Available to everyone.
  - **Main page**: This is what you see when you enter website.
  - **Registration**: Fields needed for registering user and registration button.
  - **Login**: Two fields where you enter email and password plus login button. Will redirect back to main page after successful login.
  - **Password reset**: Link in mail leads to page that shows two fields to enter new password and button to confirm change.
  - **Account deletion**: Link in mail leads to page that shows warning about irreversibility of this action and button to confirm account deletion.
  - **Email change**: Shows fields for new email, password and button to send email with link that will actually change email of this account.
  - **Members-only area**: Available only after logging in, though you do not need any special permissions. If you are unlogged, redirects to main page.
  - **Test area**: Contains few tabs: buttons that generate messages, various custom components to show off them, spinner etc.
  - **Debug area**: Contains various debug information, mainly JWT payload (if any). You also can call backend manually using `/check` endpoints.
- **Administration panel**: If unlogged, only page available is login page on admin side. Other pages redirect to login page (if unlogged) or main page on user website (if logged without required permissions).
  - **Login**: Works same as login on user website, except it will redirect to user website if user account do not have rights to admin panel.
  - **Main page**: Just a placeholder.
  - **User manager**: Requires `role_admin` or `role_operator` with at least `user_view` permission.
    - Viewing list of users in table.
    - Viewing details of selected user.
    - Viewing related data in separate tabs like history or permissions.
    - Editing data of selected user. You need additional `user_edit` permission for that.
    - Editing some related data of selected user (config, permissions).
    - Special options for user like lock/unlock.

### Custom components

All custom components implement roles, ARIA and keyboard where applicable.

- General purpose components:
  - **TextBox**: Wrapper for `<input type="text">`.
  - **CheckBox**: Implements checkbox functionality.
  - **RadioBox**: Implements radiobox (selection of one option from many) functionality.
  - **ComboBox**: HTML equivalent (`<select>` and `<options>`) is very CSS-unfriendly - very few things can be changed.
  - **DateTimePicker**: Nice picker for date/time selection.
  - **SlideShow**: Shows assigned components in rotation.
  - **DropdownMenu**: Simple menu.
  - **TabGroup**: Provides tab panel functionality.
- Dedicated components:
  - **MessageContainer** and **MessageBox**: Shows timed messages on side of screen that hide themselves after some time.
  - **TableWrapper**, **TablePage**, **TablePaginer**, **TableRow**, **TableCell**, **EntryOptions**: For showing and handling tables. Used in administration panel.
- Decorative components:
  - **SpinnerTorus**: To show frontend being busy with something (usually communication with backend).

### Local storage
Constants are in `src/code/data/app/storage.ts`.
- `app-language`: Language code. Resolved from browser (or user settings, if logged in). Missing or unknown language means fallback to `en` (English).
- `app-jwt`: JWT token. Present after you log in. Used when reloading whole page (as Pinia state will be lost) to log in again locally if token is still valid.
- `app-last-api-call`: Timestamp (ms) of the last non-auth API call. Used to detect idle sessions.
- `app-cookie-consent`: Cookie consent state. If not present, assume cookie panel should be shown.

## Commands

### Local startup

To run project locally in development mode, execute in terminal:
```
npm run dev
```

If you want to run production version:
```
npm run build
npm run preview
```

Stop server via `Ctrl+C`.

### Verification
To check validity of Typescript and Vue-specific changes using configuration in `tsconfig*.json` files:
```
npm run type-check
```

To lint code (static analysis, anti-patterns, bugs, style issues etc):
```
npm run lint
```
It runs two linters (`oxlint` and `eslint`).

### Testing

You can run tests in terminal:
```
npm run test:ci
npm run test:e2e
```

### Other

Run `prettier` via:
```
npm run format
```

## Deployment

Done using **GitHub Actions** on GitHub. See `.github/workflows/deploy.yml`.
We also have `.github/workflows/ci.yml` for verification and security.

## Tech stack

- Languages: HTML, CSS, JavaScript/TypeScript
- Frameworks: **Node.js** 24, **Vue.js** 3.5.39
- Tests: **Vitest** and **Cypress**.

### Additional packages

Besides Vue itself, we use additional libraries.
- General libraries
  - **vueuse/core**: for useful utilities
  - **vue-i18n**: for translations
  - **axios**: for HTTP client
  - **jwt-decode**: for easier handling of JWT

- Development only
  - **start-server-and-test**: utility for starting server, waiting for it and running tests. After finishing, server is killed. Useful for e2e tests.
  - **Cypress**: end-to-end testing package.
