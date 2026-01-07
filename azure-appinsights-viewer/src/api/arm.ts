export type ArmTenant = {
  tenantId: string
  displayName?: string
  countryCode?: string
  domains?: string[]
}

export type ArmSubscription = {
  subscriptionId: string
  displayName: string
  state?: string
  tenantId?: string
}

export type AppInsightsComponent = {
  id: string
  name: string
  location?: string
  resourceGroup?: string
  subscriptionId?: string
  appId?: string
  applicationId?: string
  ingestionMode?: string
}

type ArmListResponse<T> = { value: T[] }

type ArmTenantRaw = {
  tenantId: string
  displayName?: string
  countryCode?: string
  domains?: string[]
}

type ArmSubscriptionRaw = {
  subscriptionId: string
  displayName: string
  state?: string
  tenantId?: string
}

type AppInsightsComponentRaw = {
  id: string
  name: string
  location?: string
  properties?: Record<string, unknown>
}

const ARM = 'https://management.azure.com'

async function armGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${ARM}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`ARM GET ${path} failed: ${res.status} ${res.statusText} ${body}`)
  }
  return (await res.json()) as T
}

export async function listTenants(accessToken: string): Promise<ArmTenant[]> {
  const data = await armGet<ArmListResponse<ArmTenantRaw>>('/tenants?api-version=2020-01-01', accessToken)
  return (data.value ?? []).map((t) => ({
    tenantId: t.tenantId,
    displayName: t.displayName,
    countryCode: t.countryCode,
    domains: t.domains,
  }))
}

export async function listSubscriptions(accessToken: string): Promise<ArmSubscription[]> {
  const data = await armGet<ArmListResponse<ArmSubscriptionRaw>>('/subscriptions?api-version=2020-01-01', accessToken)
  return (data.value ?? []).map((s) => ({
    subscriptionId: s.subscriptionId,
    displayName: s.displayName,
    state: s.state,
    tenantId: s.tenantId,
  }))
}

function parseResourceGroupFromId(id: string): string | undefined {
  const m = id.match(/\/resourceGroups\/([^/]+)\//i)
  return m?.[1]
}

function parseSubscriptionFromId(id: string): string | undefined {
  const m = id.match(/\/subscriptions\/([^/]+)\//i)
  return m?.[1]
}

export async function listAppInsightsComponents(
  subscriptionId: string,
  accessToken: string,
): Promise<AppInsightsComponent[]> {
  const data = await armGet<ArmListResponse<AppInsightsComponentRaw>>(
    `/subscriptions/${subscriptionId}/providers/Microsoft.Insights/components?api-version=2015-05-01`,
    accessToken,
  )

  return (data.value ?? []).map((c) => {
    const id = String(c.id)
    const props = c.properties ?? {}
    return {
      id,
      name: c.name,
      location: c.location,
      resourceGroup: parseResourceGroupFromId(id),
      subscriptionId: parseSubscriptionFromId(id),
      // ARM sometimes returns AppId vs appId depending on API version.
      appId: (props['AppId'] ?? props['appId']) as string | undefined,
      applicationId: (props['ApplicationId'] ?? props['applicationId']) as string | undefined,
      ingestionMode: (props['IngestionMode'] ?? props['ingestionMode']) as string | undefined,
    } as AppInsightsComponent
  })
}

