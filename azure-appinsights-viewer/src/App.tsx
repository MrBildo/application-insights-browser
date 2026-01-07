import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react'
import { Button, Text } from '@fluentui/react-components'
import { useEffect } from 'react'
import { Portal } from './components/Portal'
import { ARM_SCOPES } from './auth/msal'

export default function App() {
  const { instance, accounts } = useMsal()

  // Ensure an active account is set (needed for silent token acquisition).
  useEffect(() => {
    if (!instance.getActiveAccount() && accounts.length > 0) {
      instance.setActiveAccount(accounts[0]!)
    }
  }, [accounts, instance])

  return (
    <>
      <UnauthenticatedTemplate>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 520, background: '#fff', padding: 24, borderRadius: 8, border: '1px solid #e1dfdd' }}>
            <Text size={600} weight="semibold" block>
              Azure Application Insights Viewer
            </Text>
            <Text block style={{ marginTop: 8, color: '#605e5c' }}>
              Sign in with Azure to browse directories, pick an Application Insights instance, and inspect invocations (requests) with traces/logs/errors.
            </Text>
            <div style={{ marginTop: 16 }}>
              <Button
                appearance="primary"
                onClick={() => instance.loginPopup({ scopes: ARM_SCOPES })}
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <Portal />
      </AuthenticatedTemplate>
    </>
  )
}
