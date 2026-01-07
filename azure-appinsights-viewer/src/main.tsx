import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { MsalProvider } from '@azure/msal-react'
import App from './App.tsx'
import './index.css'
import { msalInstance } from './auth/msal'

const rootEl: HTMLElement = (() => {
  const el = document.getElementById('root')
  if (!el) throw new Error('Missing #root element')
  return el
})()

async function bootstrap() {
  // MSAL v4 requires explicit initialization before *any* other MSAL API calls.
  await msalInstance.initialize()

  // If returning from a redirect login, process the response before rendering.
  await msalInstance.handleRedirectPromise()

  // Ensure we have an active account for silent token acquisition.
  const accounts = msalInstance.getAllAccounts()
  if (!msalInstance.getActiveAccount() && accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]!)
  }

  createRoot(rootEl).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <FluentProvider theme={webLightTheme}>
          <App />
        </FluentProvider>
      </MsalProvider>
    </StrictMode>,
  )
}

bootstrap().catch((e) => {
  console.error('Failed to initialize authentication', e)
  const msg =
    e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e)
  createRoot(rootEl).render(
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 720 }}>
        <h2 style={{ margin: 0 }}>Failed to initialize authentication</h2>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
          {msg}
        </pre>
      </div>
    </div>,
  )
})
