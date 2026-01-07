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

export type InvocationRow = {
  timestamp: string
  name: string
  success: boolean
  resultCode: string
  durationMs: number
  operationId: string
  requestId: string
  matchCount?: number
}

const useStyles = makeStyles({
  wrap: { padding: '12px' },
  tableWrap: { overflow: 'auto', maxHeight: '560px' },
  headerLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  subtle: { color: '#605e5c' },
  selectedRow: {
    backgroundColor: '#eff6fc',
  },
  clickableRow: {
    cursor: 'pointer',
    ':hover': { backgroundColor: '#f3f2f1' },
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
  },
})

export function InvocationsTable(props: {
  mode: 'list' | 'search'
  rows: InvocationRow[]
  loading: boolean
  selectedOperationId: string | null
  onSelect: (operationId: string) => void
  onLoadMore: () => void
  canLoadMore: boolean
}) {
  const styles = useStyles()

  return (
    <div className={styles.wrap}>
      <div className={styles.headerLine}>
        <div>
          <Text weight="semibold">Invocations</Text>
          <Text size={200} className={styles.subtle} block>
            {props.mode === 'search'
              ? 'Search results (matched traces)'
              : 'Most recent requests (newest first)'}
          </Text>
        </div>
        {props.loading ? <Spinner size="tiny" /> : null}
      </div>

      <div className={styles.tableWrap}>
        <Table size="small" aria-label="Invocations table">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Result</TableHeaderCell>
              <TableHeaderCell>Duration (ms)</TableHeaderCell>
              <TableHeaderCell>Operation ID</TableHeaderCell>
              {props.mode === 'search' ? <TableHeaderCell>Matches</TableHeaderCell> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.map((r) => {
              const isSelected = props.selectedOperationId === r.operationId
              return (
                <TableRow
                  key={`${r.operationId}-${r.requestId}-${r.timestamp}`}
                  className={`${styles.clickableRow} ${isSelected ? styles.selectedRow : ''}`}
                  onClick={() => props.onSelect(r.operationId)}
                >
                  <TableCell>{new Date(r.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{r.success ? 'Success' : 'Failure'}</TableCell>
                  <TableCell>{r.resultCode}</TableCell>
                  <TableCell>{Math.round(r.durationMs)}</TableCell>
                  <TableCell>
                    <Text size={200} className={styles.subtle}>
                      {r.operationId}
                    </Text>
                  </TableCell>
                  {props.mode === 'search' ? <TableCell>{r.matchCount ?? ''}</TableCell> : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className={styles.footer}>
        <Text size={200} className={styles.subtle}>
          Showing {props.rows.length} rows
        </Text>
        <Button
          appearance="secondary"
          disabled={!props.canLoadMore || props.loading}
          onClick={props.onLoadMore}
        >
          Load more
        </Button>
      </div>
    </div>
  )
}

