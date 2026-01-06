import { useMsal } from '@azure/msal-react'
import {
  Button,
  Dropdown,
  Input,
  Option,
  Spinner,
  Switch,
  Text,
  makeStyles,
} from '@fluentui/react-components'
import { useEffect, useMemo, useState } from 'react'
import { ARM_SCOPES, LOGS_SCOPES } from '../auth/msal'
import type { AppInsightsComponent, ArmSubscription, ArmTenant } from '../api/arm'
import { listAppInsightsComponents, listSubscriptions, listTenants } from '../api/arm'
import { queryAppInsights } from '../api/logs'
import type { TimeRange } from '../kql/queries'
import {
  invocationDetailsQuery,
  invocationsQuery,
  searchInvocationsByTraceKeywordQuery,
} from '../kql/queries'
import { useAzureToken } from '../hooks/useAzureToken'
import { InvocationsTable, type InvocationRow } from './invocations/InvocationsTable'
import { InvocationDetails } from './invocations/InvocationDetails'

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateRows: '48px 1fr',
    background: '#f5f5f5',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: '1px solid #e1dfdd',
    background: '#ffffff',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: '12px',
    padding: '12px',
    alignItems: 'start',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e1dfdd',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '12px 12px 8px 12px',
    borderBottom: '1px solid #edebe9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  cardBody: {
    padding: '12px',
  },
  formRow: {
    display: 'grid',
    gap: '6px',
    marginBottom: '10px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  smallMeta: { color: '#605e5c' },
  rightCardBody: {
    padding: 0,
  },
  invocationsToolbar: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '8px',
    alignItems: 'end',
    padding: '12px',
    borderBottom: '1px solid #edebe9',
    background: '#ffffff',
  },
  toolbarLeft: {
    display: 'grid',
    gap: '8px',
  },
  statusSummary: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  summaryBox: {
    border: '1px solid #edebe9',
    borderRadius: '6px',
    padding: '8px 10px',
    background: '#faf9f8',
  },
})

type Mode = 'list' | 'search'

const LS_KEYS = {
  tenantId: 'aiv.activeTenantId',
  subscriptionId: 'aiv.activeSubscriptionId',
  appInsightsId: 'aiv.activeAppInsightsResourceId',
  timeRange: 'aiv.timeRange',
  autoRefresh: 'aiv.autoRefresh',
  autoRefreshSeconds: 'aiv.autoRefreshSeconds',
}

export function Portal() {
  const styles = useStyles()
  const { instance } = useMsal()
  const { getAccessToken } = useAzureToken()

  const activeAccount = instance.getActiveAccount()
  const defaultTenantId = activeAccount?.tenantId

  const [loading, setLoading] = useState<{ tenants?: boolean; subs?: boolean; apps?: boolean; inv?: boolean; details?: boolean }>({})
  const [error, setError] = useState<string | null>(null)

  const [tenants, setTenants] = useState<ArmTenant[]>([])
  const [subscriptions, setSubscriptions] = useState<ArmSubscription[]>([])
  const [apps, setApps] = useState<AppInsightsComponent[]>([])

  const [tenantId, setTenantId] = useState<string>(() => localStorage.getItem(LS_KEYS.tenantId) ?? defaultTenantId ?? '')
  const [subscriptionId, setSubscriptionId] = useState<string>(() => localStorage.getItem(LS_KEYS.subscriptionId) ?? '')
  const [appInsightsResourceId, setAppInsightsResourceId] = useState<string>(() => localStorage.getItem(LS_KEYS.appInsightsId) ?? '')

  const [timeRange, setTimeRange] = useState<TimeRange>(() => (localStorage.getItem(LS_KEYS.timeRange) as TimeRange | null) ?? 'P30D')
  const [mode, setMode] = useState<Mode>('list')
  const [search, setSearch] = useState<string>('')

  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => (localStorage.getItem(LS_KEYS.autoRefresh) ?? 'false') === 'true')
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number>(() => Number(localStorage.getItem(LS_KEYS.autoRefreshSeconds) ?? '30') || 30)

  const [invocations, setInvocations] = useState<InvocationRow[]>([])
  const [invocationOffset, setInvocationOffset] = useState<number>(0)
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null)
  const [details, setDetails] = useState<any[]>([])

  const activeApp = useMemo(() => apps.find((a) => a.id === appInsightsResourceId) ?? null, [apps, appInsightsResourceId])
  const appId = activeApp?.appId ?? null

  const successCount = useMemo(() => invocations.filter((i) => i.success).length, [invocations])
  const errorCount = useMemo(() => invocations.filter((i) => i.success === false).length, [invocations])

  useEffect(() => {
    if (!tenantId && defaultTenantId) setTenantId(defaultTenantId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTenantId])

  useEffect(() => {
    localStorage.setItem(LS_KEYS.tenantId, tenantId)
  }, [tenantId])
  useEffect(() => {
    localStorage.setItem(LS_KEYS.subscriptionId, subscriptionId)
  }, [subscriptionId])
  useEffect(() => {
    localStorage.setItem(LS_KEYS.appInsightsId, appInsightsResourceId)
  }, [appInsightsResourceId])
  useEffect(() => {
    localStorage.setItem(LS_KEYS.timeRange, timeRange)
  }, [timeRange])
  useEffect(() => {
    localStorage.setItem(LS_KEYS.autoRefresh, String(autoRefresh))
  }, [autoRefresh])
  useEffect(() => {
    localStorage.setItem(LS_KEYS.autoRefreshSeconds, String(autoRefreshSeconds))
  }, [autoRefreshSeconds])

  async function loadTenants() {
    setError(null)
    setLoading((s) => ({ ...s, tenants: true }))
    try {
      const token = await getAccessToken({ scopes: ARM_SCOPES })
      const t = await listTenants(token)
      setTenants(t)
      if (!tenantId) {
        const preferred = t.find((x) => x.tenantId === defaultTenantId)?.tenantId ?? t[0]?.tenantId ?? ''
        setTenantId(preferred)
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading((s) => ({ ...s, tenants: false }))
    }
  }

  async function loadSubscriptions(forTenantId: string) {
    setError(null)
    setLoading((s) => ({ ...s, subs: true }))
    try {
      const token = await getAccessToken({ scopes: ARM_SCOPES, tenantId: forTenantId })
      const s = await listSubscriptions(token)
      setSubscriptions(s)
      if (!s.some((x) => x.subscriptionId === subscriptionId)) {
        setSubscriptionId(s[0]?.subscriptionId ?? '')
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading((s) => ({ ...s, subs: false }))
    }
  }

  async function loadApps(forTenantId: string, forSubscriptionId: string) {
    setError(null)
    setLoading((s) => ({ ...s, apps: true }))
    try {
      const token = await getAccessToken({ scopes: ARM_SCOPES, tenantId: forTenantId })
      const a = await listAppInsightsComponents(forSubscriptionId, token)
      a.sort((x, y) => (x.name ?? '').localeCompare(y.name ?? ''))
      setApps(a)
      if (!a.some((x) => x.id === appInsightsResourceId)) {
        setAppInsightsResourceId(a[0]?.id ?? '')
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading((s) => ({ ...s, apps: false }))
    }
  }

  async function loadInvocationsPage(args: { reset: boolean }) {
    if (!appId) return
    setError(null)
    setLoading((s) => ({ ...s, inv: true }))
    try {
      const offset = args.reset ? 0 : invocationOffset
      const token = await getAccessToken({ scopes: LOGS_SCOPES, tenantId })
      const kql =
        mode === 'search' && search.trim().length > 0
          ? searchInvocationsByTraceKeywordQuery({ keyword: search.trim(), timeRange, limit: 100 })
          : invocationsQuery({ timeRange, offset, limit: 100 })
      const resp = await queryAppInsights(appId, kql, token)
      const rows = resp.objectsByTable.PrimaryResult ?? []
      const next = rows.map((r) => ({
        timestamp: String(r.timestamp ?? ''),
        name: String(r.name ?? ''),
        success: r.success === true,
        resultCode: String(r.resultCode ?? ''),
        durationMs: Number(r.duration ?? 0),
        operationId: String(r.operation_Id ?? ''),
        requestId: String(r.id ?? ''),
        matchCount: typeof r.matchCount === 'number' ? r.matchCount : undefined,
      })) as InvocationRow[]

      setInvocations((prev) => (args.reset ? next : [...prev, ...next]))
      setInvocationOffset(offset + (mode === 'search' ? next.length : 100))
      if (args.reset) {
        setSelectedOperationId(null)
        setDetails([])
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading((s) => ({ ...s, inv: false }))
    }
  }

  async function loadInvocationDetails(operationId: string) {
    if (!appId) return
    setError(null)
    setLoading((s) => ({ ...s, details: true }))
    try {
      const token = await getAccessToken({ scopes: LOGS_SCOPES, tenantId })
      const kql = invocationDetailsQuery({ operationId, timeRange })
      const resp = await queryAppInsights(appId, kql, token)
      const rows = resp.objectsByTable.PrimaryResult ?? []
      setDetails(rows)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading((s) => ({ ...s, details: false }))
    }
  }

  useEffect(() => {
    void loadTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!tenantId) return
    // switching tenant resets downstream selections
    setSubscriptions([])
    setApps([])
    setInvocations([])
    setInvocationOffset(0)
    setSelectedOperationId(null)
    setDetails([])
    setSubscriptionId('')
    setAppInsightsResourceId('')
    void loadSubscriptions(tenantId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  useEffect(() => {
    if (!tenantId || !subscriptionId) return
    setApps([])
    setInvocations([])
    setInvocationOffset(0)
    setSelectedOperationId(null)
    setDetails([])
    void loadApps(tenantId, subscriptionId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, subscriptionId])

  useEffect(() => {
    if (!appId) return
    setInvocations([])
    setInvocationOffset(0)
    void loadInvocationsPage({ reset: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, timeRange, mode])

  useEffect(() => {
    if (!autoRefresh) return
    if (!appId) return
    const id = window.setInterval(() => {
      void loadInvocationsPage({ reset: true })
    }, autoRefreshSeconds * 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, autoRefreshSeconds, appId, tenantId, timeRange, mode, search])

  const tenantOptions = tenants.map((t) => ({
    key: t.tenantId,
    label: t.displayName ? `${t.displayName}` : t.tenantId,
    meta: t.domains?.[0],
  }))
  const subOptions = subscriptions.map((s) => ({ key: s.subscriptionId, label: s.displayName }))
  const appOptions = apps.map((a) => ({
    key: a.id,
    label: a.resourceGroup ? `${a.name} (${a.resourceGroup})` : a.name,
    meta: a.location,
  }))

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Text weight="semibold">Application Insights Viewer</Text>
          <Text size={200} className={styles.smallMeta}>
            Invocations + traces/logs/errors (Portal-style)
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text size={200} className={styles.smallMeta}>
            {activeAccount?.username}
          </Text>
          <Button appearance="subtle" onClick={() => instance.logoutPopup()}>
            Sign out
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Text weight="semibold">Directories + subscriptions</Text>
            <Button appearance="subtle" onClick={() => void loadTenants()} disabled={!!loading.tenants}>
              Refresh
            </Button>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formRow}>
              <Text size={200} className={styles.smallMeta}>
                Active directory (tenant)
              </Text>
              <Dropdown
                placeholder={loading.tenants ? 'Loading directories…' : 'Select directory'}
                value={tenantOptions.find((o) => o.key === tenantId)?.label ?? ''}
                disabled={loading.tenants || tenantOptions.length === 0}
                onOptionSelect={(_, data) => setTenantId(String(data.optionValue ?? ''))}
              >
                {tenantOptions.map((o) => (
                  <Option key={o.key} value={o.key} text={o.label}>
                    <div style={{ display: 'grid' }}>
                      <span>{o.label}</span>
                      {o.meta ? <span style={{ color: '#605e5c', fontSize: 12 }}>{o.meta}</span> : null}
                    </div>
                  </Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.formRow}>
              <Text size={200} className={styles.smallMeta}>
                Subscription
              </Text>
              <Dropdown
                placeholder={loading.subs ? 'Loading subscriptions…' : 'Select subscription'}
                value={subOptions.find((o) => o.key === subscriptionId)?.label ?? ''}
                disabled={!tenantId || loading.subs || subOptions.length === 0}
                onOptionSelect={(_, data) => setSubscriptionId(String(data.optionValue ?? ''))}
              >
                {subOptions.map((o) => (
                  <Option key={o.key} value={o.key} text={o.label}>
                    {o.label}
                  </Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.formRow}>
              <Text size={200} className={styles.smallMeta}>
                Application Insights instance
              </Text>
              <Dropdown
                placeholder={loading.apps ? 'Loading instances…' : 'Select instance'}
                value={appOptions.find((o) => o.key === appInsightsResourceId)?.label ?? ''}
                disabled={!subscriptionId || loading.apps || appOptions.length === 0}
                onOptionSelect={(_, data) => setAppInsightsResourceId(String(data.optionValue ?? ''))}
              >
                {appOptions.map((o) => (
                  <Option key={o.key} value={o.key} text={o.label}>
                    <div style={{ display: 'grid' }}>
                      <span>{o.label}</span>
                      {o.meta ? <span style={{ color: '#605e5c', fontSize: 12 }}>{o.meta}</span> : null}
                    </div>
                  </Option>
                ))}
              </Dropdown>
              {activeApp?.appId ? (
                <Text size={200} className={styles.smallMeta}>
                  App ID: {activeApp.appId}
                </Text>
              ) : null}
            </div>

            <div className={styles.formRow}>
              <Text size={200} className={styles.smallMeta}>
                Options
              </Text>
              <div className={styles.twoCol}>
                <Dropdown
                  value={
                    timeRange === 'PT24H' ? 'Last 24 hours' : timeRange === 'P7D' ? 'Last 7 days' : 'Last 30 days'
                  }
                  onOptionSelect={(_, data) => setTimeRange(data.optionValue as TimeRange)}
                >
                  <Option value="PT24H">Last 24 hours</Option>
                  <Option value="P7D">Last 7 days</Option>
                  <Option value="P30D">Last 30 days</Option>
                </Dropdown>
                <Switch
                  checked={autoRefresh}
                  onChange={(_, data) => setAutoRefresh(data.checked)}
                  label="Auto-refresh"
                />
              </div>
              {autoRefresh ? (
                <Dropdown
                  value={`${autoRefreshSeconds}s`}
                  onOptionSelect={(_, data) => setAutoRefreshSeconds(Number(data.optionValue))}
                >
                  <Option value="10">10s</Option>
                  <Option value="30">30s</Option>
                  <Option value="60">60s</Option>
                  <Option value="120">120s</Option>
                </Dropdown>
              ) : null}
            </div>

            {error ? (
              <div style={{ border: '1px solid #f3b1b1', background: '#fff5f5', padding: 10, borderRadius: 6 }}>
                <Text weight="semibold">Error</Text>
                <div style={{ marginTop: 4, color: '#a4262c', fontSize: 12, whiteSpace: 'pre-wrap' }}>{error}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.invocationsToolbar}>
            <div className={styles.toolbarLeft}>
              <Text weight="semibold">
                Invocations {activeApp ? <span style={{ color: '#605e5c', fontWeight: 400 }}>— {activeApp.name}</span> : null}
              </Text>
              <div className={styles.statusSummary}>
                <div className={styles.summaryBox}>
                  <Text size={200} className={styles.smallMeta}>
                    Success count
                  </Text>
                  <Text weight="semibold">{successCount}</Text>
                </div>
                <div className={styles.summaryBox}>
                  <Text size={200} className={styles.smallMeta}>
                    Error count
                  </Text>
                  <Text weight="semibold">{errorCount}</Text>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  <Text size={200} className={styles.smallMeta}>
                    Search traces (keyword)
                  </Text>
                  <Input
                    value={search}
                    placeholder='Search traces (e.g. "timeout")'
                    onChange={(_, data) => setSearch(data.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const kw = search.trim()
                        setMode(kw ? 'search' : 'list')
                        setInvocations([])
                        setInvocationOffset(0)
                        void loadInvocationsPage({ reset: true })
                      }
                    }}
                  />
                </div>
                <Button
                  appearance="primary"
                  disabled={!appId || loading.inv || search.trim().length === 0}
                  onClick={() => {
                    setMode('search')
                    setInvocations([])
                    setInvocationOffset(0)
                    void loadInvocationsPage({ reset: true })
                  }}
                >
                  Search
                </Button>
                <Button
                  appearance="subtle"
                  disabled={!appId || loading.inv}
                  onClick={() => {
                    setMode('list')
                    setSearch('')
                    setInvocations([])
                    setInvocationOffset(0)
                    void loadInvocationsPage({ reset: true })
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
              {loading.inv ? <Spinner size="tiny" /> : null}
              <Button
                appearance="subtle"
                disabled={!appId || loading.inv}
                onClick={() => void loadInvocationsPage({ reset: true })}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className={styles.rightCardBody}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', minHeight: 560 }}>
              <div style={{ borderRight: '1px solid #edebe9' }}>
                <InvocationsTable
                  mode={mode}
                  rows={invocations}
                  loading={!!loading.inv}
                  selectedOperationId={selectedOperationId}
                  onSelect={(opId) => {
                    setSelectedOperationId(opId)
                    void loadInvocationDetails(opId)
                  }}
                  onLoadMore={() => void loadInvocationsPage({ reset: false })}
                  canLoadMore={mode === 'list' && !!appId && !loading.inv}
                />
              </div>
              <InvocationDetails
                operationId={selectedOperationId}
                loading={!!loading.details}
                rows={details}
                onRefresh={() => {
                  if (selectedOperationId) void loadInvocationDetails(selectedOperationId)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

