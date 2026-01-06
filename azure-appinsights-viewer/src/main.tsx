import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { MsalProvider } from '@azure/msal-react'
import App from './App.tsx'
import './index.css'
import { msalInstance } from './auth/msal'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <FluentProvider theme={webLightTheme}>
        <App />
      </FluentProvider>
    </MsalProvider>
  </StrictMode>,
)
