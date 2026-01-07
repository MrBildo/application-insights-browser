import { PublicClientApplication } from '@azure/msal-browser'

function requiredEnv(name: string): string {
  const v = import.meta.env[name] as string | undefined
  if (!v || v.trim().length === 0) {
    throw new Error(
      `Missing environment variable ${name}. See .env.example and README.md.`,
    )
  }
  return v
}

export const msalConfig = {
  auth: {
    clientId: requiredEnv('VITE_AZURE_CLIENT_ID'),
    authority: (import.meta.env.VITE_AZURE_AUTHORITY as string | undefined) ??
      'https://login.microsoftonline.com/common',
    redirectUri:
      (import.meta.env.VITE_AZURE_REDIRECT_URI as string | undefined) ??
      window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    // Helps in some legacy/embedded browser scenarios.
    storeAuthStateInCookie: true,
  },
}

export const msalInstance = new PublicClientApplication(msalConfig)

export const ARM_SCOPES = ['https://management.azure.com/user_impersonation']
export const LOGS_SCOPES = ['https://api.loganalytics.io/.default']

