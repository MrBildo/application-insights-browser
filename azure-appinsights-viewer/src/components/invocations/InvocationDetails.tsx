import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
} from '@fluentui/react-components'

const useStyles = makeStyles({
  wrap: { padding: '12px', background: '#ffffff' },
  headerLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  subtle: { color: '#605e5c' },
  tableWrap: { overflow: 'auto', maxHeight: '560px' },
  message: { maxWidth: '520px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
})

type DetailRow = {
  timestamp?: unknown
  itemType?: unknown
  message?: unknown
  severityLevel?: unknown
  resultCode?: unknown
  success?: unknown
  duration?: unknown
  type?: unknown
  cloud_RoleName?: unknown
}

function toStringSafe(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

export function InvocationDetails(props: {
  operationId: string | null
  loading: boolean
  rows: DetailRow[]
  onRefresh: () => void
}) {
  const styles = useStyles()

  if (!props.operationId) {
    return (
      <div className={styles.wrap}>
        <Text weight="semibold">Invocation details</Text>
        <Text size={200} className={styles.subtle} block style={{ marginTop: 6 }}>
          Select an invocation on the left to view traces, requests, dependencies, and exceptions.
        </Text>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerLine}>
        <div>
          <Text weight="semibold">Invocation details</Text>
          <Text size={200} className={styles.subtle} block>
            Operation ID: {props.operationId}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {props.loading ? <Spinner size="tiny" /> : null}
          <Button appearance="subtle" onClick={props.onRefresh} disabled={props.loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <Table size="small" aria-label="Invocation details table">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Message</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  {r.timestamp ? new Date(String(r.timestamp)).toLocaleString() : ''}
                </TableCell>
                <TableCell>{toStringSafe(r.itemType)}</TableCell>
                <TableCell>
                  <div className={styles.message}>{toStringSafe(r.message)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

