export type TimeRange = 'PT24H' | 'P7D' | 'P30D'

export function timeRangeToAgo(range: TimeRange): string {
  switch (range) {
    case 'PT24H':
      return 'ago(24h)'
    case 'P7D':
      return 'ago(7d)'
    case 'P30D':
      return 'ago(30d)'
  }
}

export function invocationsQuery(args: {
  timeRange: TimeRange
  offset: number
  limit: number
}): string {
  const ago = timeRangeToAgo(args.timeRange)
  // KQL has no skip; emulate paging with row_number over a stable sort.
  const start = args.offset + 1
  const end = args.offset + args.limit

  return `
requests
| where timestamp >= ${ago}
| sort by timestamp desc
| serialize rn = row_number()
| where rn between (${start} .. ${end})
| project timestamp, name, success, resultCode, duration, operation_Id, id
| order by timestamp desc
`.trim()
}

export function invocationDetailsQuery(args: {
  operationId: string
  timeRange: TimeRange
}): string {
  const ago = timeRangeToAgo(args.timeRange)
  const op = args.operationId.replace(/"/g, '\\"')

  return `
union isfuzzy=true
  (requests | where timestamp >= ${ago}),
  (traces | where timestamp >= ${ago}),
  (exceptions | where timestamp >= ${ago}),
  (dependencies | where timestamp >= ${ago})
| where operation_Id == "${op}"
| extend itemType = tostring(itemType)
| extend message = coalesce(tostring(message), tostring(outerMessage), tostring(name))
| project timestamp, itemType, message, severityLevel, resultCode, success, duration, type, cloud_RoleName
| order by timestamp asc
`.trim()
}

export function searchInvocationsByTraceKeywordQuery(args: {
  keyword: string
  timeRange: TimeRange
  limit: number
}): string {
  const ago = timeRangeToAgo(args.timeRange)
  const kw = args.keyword.replace(/"/g, '\\"')

  return `
let hits =
  traces
  | where timestamp >= ${ago}
  | where message has "${kw}"
  | summarize matchCount=count() by operation_Id;
hits
| join kind=inner (
    requests
    | where timestamp >= ${ago}
    | project timestamp, name, success, resultCode, duration, operation_Id, id
  ) on operation_Id
| project timestamp, name, success, resultCode, duration, operation_Id, id, matchCount
| order by timestamp desc
| take ${args.limit}
`.trim()
}

