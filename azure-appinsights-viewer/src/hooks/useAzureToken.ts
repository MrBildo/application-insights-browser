import type { AccountInfo, PopupRequest, SilentRequest } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'

export function useAzureToken() {
  const { instance } = useMsal()

  async function getAccessToken(args: {
    scopes: string[]
    tenantId?: string
  }): Promise<string> {
    const account: AccountInfo | null = instance.getActiveAccount()
    if (!account) throw new Error('No active account. Please sign in again.')

    const authority = args.tenantId
      ? `https://login.microsoftonline.com/${args.tenantId}`
      : undefined

    const silentReq: SilentRequest = {
      scopes: args.scopes,
      account,
      authority,
    }

    try {
      const resp = await instance.acquireTokenSilent(silentReq)
      return resp.accessToken
    } catch {
      const popupReq: PopupRequest = {
        scopes: args.scopes,
        authority,
      }
      const resp = await instance.acquireTokenPopup(popupReq)
      return resp.accessToken
    }
  }

  return { getAccessToken }
}

