# Azure Application Insights Viewer (React)

React app that authenticates with Azure, lets you **switch directories (tenants)**, select an **Application Insights instance**, then browse **invocations** (requests) and view **all traces/logs/errors** for a selected invocation (operation).

## Features

- **Azure sign-in** via MSAL (persistent via `localStorage`)
- **Directory (tenant) dropdown** (uses Azure Resource Manager `tenants` endpoint)
- **Subscription + App Insights instance pickers**
- **Invocations list** (default last 100, newest first) + **Load more**
- **Invocation details** (union of requests/traces/exceptions/dependencies for the same `operation_Id`)
- **Keyword search** across `traces` and returns matching invocations
- **Auto-refresh** (optional)

## Prerequisites

- Node.js 18+ (this repo uses modern Vite)
- An **Azure App Registration** (SPA / public client)
- Your signed-in user must have at least **Reader** access to the subscriptions/resources you want to browse.

## Azure App Registration setup

1. Create an App Registration in Entra ID.
2. Add a **SPA Redirect URI**:
   - `http://localhost:5173`
3. API permissions (Delegated):
   - **Azure Service Management**: `user_impersonation`
   - **Log Analytics API**: `Data.Read`
   - (Optional) Microsoft Graph: `User.Read`
4. Grant admin consent if your tenant requires it.

## Configure env vars

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set:

- `VITE_AZURE_CLIENT_ID`: your App Registration client id
- (Optional) `VITE_AZURE_REDIRECT_URI`: defaults to `window.location.origin`
- (Optional) `VITE_AZURE_AUTHORITY`: defaults to `https://login.microsoftonline.com/common`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Notes on how it works

- **Directories**: `GET https://management.azure.com/tenants?api-version=2020-01-01`
- **Subscriptions**: `GET https://management.azure.com/subscriptions?api-version=2020-01-01`
- **App Insights instances**: `GET .../providers/Microsoft.Insights/components?api-version=2015-05-01`
- **Invocations + details**: KQL via
  - `POST https://api.loganalytics.io/v1/apps/{appId}/query`

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
