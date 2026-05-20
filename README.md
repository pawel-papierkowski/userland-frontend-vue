# UserLand Frontend Vue

This project is *frontend* part of **UserLand system**, designed to work with backend project `userland-backend-java`.

Project is in development.

Description below sums up intended state when project is completed: functionality, features etc.

## Basic info

Author: Paweł Papierkowski

Date: 2026

- Link to webpage:
  - User website: https://pawelpapierkowski.net.pl/userland-frontend-vue
  - Admin panel: https://pawelpapierkowski.net.pl/userland-frontend-vue/panel
- Link to source code: https://github.com/pawel-papierkowski/userland-frontend-vue

Used IDE: **Visual Studio Code**

### Functionality

This project fully manages user on frontend side.

### Features

Frontend is split into two parts: **user website** and **admin panel**. Each one is separate Single Page Application (SPA).

- **User website**: Available to everyone.
  - **Main page**: This is what you see when you enter website. Looks differently depending on if you are logged in or not.
  - **Registration**: Fields needed for registering user and registration button.
  - **Login**: Two fields where you enter email and password plus login button. Will redirect back to main page.
  - **Password reset**: From link in mail. Shows two fields to enter new password and button to confirm change.
  - **Account deletion**: From link in mail. Shows warning about irreversibility of this action and button to confirm account deletion.
  - **Email change**: From link in mail. Shows info about new email and button to confirm change.
  - **Members-only area**: Available only after logging in, though you do not need any special permissions. If you are unlogged, redirects to main page.
  - **Test area**: Contains various buttons that generate messages based on various things. Many of them calls `/api/check` endpoints.
- **Administration panel**: If unlogged, only page available is Login page. Other pages redirect to login page (if unlogged) or main page on user website (if logged without required permissions).
  - **Login**: works same as login on user website, except it will redirect to user website if user account do not have rights to admin panel.
  - **Main page**.
  - **User manager**:
    - Viewing list of users in table.
    - Viewing details of selected users.
    - Viewing related data in separate tabs like history or permissions.
    - Editing data of selected user.
    - Editing some of related data of selected user.
    - Special options for user like lock/unlock.
- **Other features**
  - Multiple languages support
  - Nice error messages from backend endpoints leveraging Problem Details

## Environment

### Local storage

- `app-language`: Language code. Resolved from browser or user settings, if logged in. Missing or unknown language means fallback to `en` (English).
- `app-jwt`: JWT token. Present after you log in. Used when reloading page (as Pinia state will be lost) to log in again locally (if token is still valid).

## Local startup

To run project locally in development mode, execute in terminal:
`npm run dev`

If you want to check production version:
```
npm run build
npm run preview
```

Stop server via `Ctrl+C`.

## Testing
[TODO]


## Deployment

Done using GitHub actions.


## Tech stack

- Language: HTML, CSS, JavaScript/TypeScript
- Framework: **Vue** 3.22.3

### Additional packages

- **Cypress** as end-to-end testing package.
- General libraries
  - **vueuse/core** for useful utilities
  - **vue-i18n** for translations
  - **axios** for HTTP client
