export type LogsTable = {
  name: string
  columns: { name: string; type: string }[]
  rows: unknown[][]
}

export type LogsQueryResponse = {
  tables: LogsTable[]
}

export type LogsQueryResultRow = Record<string, unknown>

function toObjects(table: LogsTable): LogsQueryResultRow[] {
  const cols = table.columns.map((c) => c.name)
  return (table.rows ?? []).map((r) => {
    const obj: LogsQueryResultRow = {}
    for (let i = 0; i < cols.length; i++) obj[cols[i]!] = r[i]
    return obj
  })
}

export async function queryAppInsights(
  appId: string,
  kql: string,
  accessToken: string,
): Promise<{ tables: LogsTable[]; objectsByTable: Record<string, LogsQueryResultRow[]> }> {
  const res = await fetch(`https://api.loganalytics.io/v1/apps/${encodeURIComponent(appId)}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: kql }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Logs query failed: ${res.status} ${res.statusText} ${body}`)
  }

  const data = (await res.json()) as LogsQueryResponse
  const objectsByTable: Record<string, LogsQueryResultRow[]> = {}
  for (const t of data.tables ?? []) objectsByTable[t.name] = toObjects(t)

  return { tables: data.tables ?? [], objectsByTable }
}

