export type TimeRange = 'PT24H' | 'P7D' | 'P30D' | 'P60D' | 'P90D' | 'P365D' | 'FOREVER'

export function timeRangeToAgo(range: Exclude<TimeRange, 'FOREVER'>): string {
  switch (range) {
    case 'PT24H':
      return 'ago(24h)'
    case 'P7D':
      return 'ago(7d)'
    case 'P30D':
      return 'ago(30d)'
    case 'P60D':
      return 'ago(60d)'
    case 'P90D':
      return 'ago(90d)'
    case 'P365D':
      return 'ago(365d)'
  }
}

function timeRangeTimestampFilter(range: TimeRange): string {
  if (range === 'FOREVER') return ''
  return `| where timestamp >= ${timeRangeToAgo(range)}`
}

export function invocationsQuery(args: {
  timeRange: TimeRange
  offset: number
  limit: number
}): string {
  const filter = timeRangeTimestampFilter(args.timeRange)
  // KQL has no skip; emulate paging with row_number over a stable sort.
  const start = args.offset + 1
  const end = args.offset + args.limit

  return `
requests
${filter}
| sort by timestamp desc
| serialize rn = row_number()
| where rn between (${start} .. ${end})
| extend rc = tostring(resultCode)
| extend rcInt = toint(rc)
| extend successBool = coalesce(
    tobool(success),
    case(
      rc == "0", true,
      rcInt between (200 .. 399), true,
      false
    )
  )
| project timestamp, name, success=successBool, resultCode=rc, duration, operation_Id, id
| order by timestamp desc
`.trim()
}

export function invocationDetailsQuery(args: {
  operationId: string
  timeRange: TimeRange
}): string {
  const filter = timeRangeTimestampFilter(args.timeRange)
  const op = args.operationId.replace(/"/g, '\\"')

  return `
union isfuzzy=true
  (requests ${filter}),
  (traces ${filter}),
  (exceptions ${filter}),
  (dependencies ${filter})
| where operation_Id == "${op}"
| extend itemType = tostring(itemType)
| extend loglevel = tostring(customDimensions.['LogLevel'])
| extend message = coalesce(tostring(message), tostring(outerMessage), tostring(name))
| where itemType != "request"
| project timestamp, itemType, loglevel, message, severityLevel, resultCode, success, duration, type, cloud_RoleName
| order by timestamp asc
`.trim()
}

export function searchInvocationsByTraceKeywordQuery(args: {
  keyword: string
  timeRange: TimeRange
  limit: number
}): string {
  const filter = timeRangeTimestampFilter(args.timeRange)
  const kw = args.keyword.replace(/"/g, '\\"')

  return `
let hits =
  union isfuzzy=true
    (traces ${filter}),
    (exceptions ${filter})
  | extend message = coalesce(tostring(message), tostring(outerMessage), tostring(name))
  | where message has "${kw}"
  | summarize matchCount=count() by operation_Id;
hits
| join kind=inner (
    requests
    ${filter}
    | extend rc = tostring(resultCode)
    | extend rcInt = toint(rc)
    | extend successBool = coalesce(
        tobool(success),
        case(
          rc == "0", true,
          rcInt between (200 .. 399), true,
          false
        )
      )
    | project timestamp, name, success=successBool, resultCode=rc, duration, operation_Id, id
  ) on operation_Id
| project timestamp, name, success, resultCode, duration, operation_Id, id, matchCount
| order by timestamp desc
| take ${args.limit}
`.trim()
}

