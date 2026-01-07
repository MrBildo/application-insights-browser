import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  Text,
  makeStyles,
} from '@fluentui/react-components'
import { Dismiss24Regular } from '@fluentui/react-icons'
import { useState } from 'react'

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
  selectedRow: { backgroundColor: '#eff6fc' },
  clickableRow: { cursor: 'pointer', ':hover': { backgroundColor: '#f3f2f1' } },
  dialogSurface: {
    resize: 'both',
    overflow: 'hidden',
    minWidth: '640px',
    minHeight: '420px',
    maxWidth: '92vw',
    maxHeight: '92vh',
    display: 'flex',
  },
  dialogBody: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  dialogLayout: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', flex: 1, minHeight: 0 },
  metaGrid: { display: 'grid', gap: '10px' },
  fullMessageSection: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
  fullMessageArea: {
    flex: 1,
    minHeight: 0,
    '& textarea': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      backgroundColor: '#0f0f10',
      color: '#f5f5f5',
      border: '1px solid #2b2b2d',
      lineHeight: '1.35',
      height: '100%',
      minHeight: 0,
    },
  },
})

type DetailRow = {
  timestamp?: unknown
  itemType?: unknown
  loglevel?: unknown
  message?: unknown
  severityLevel?: unknown
  resultCode?: unknown
  success?: unknown
  duration?: unknown
  type?: unknown
  cloud_RoleName?: unknown
}

type InvocationMeta = {
  timestamp: string
  success: boolean
  durationMs: number
  operationId: string
}

function toStringSafe(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function toTimeMs(v: unknown): number | null {
  const s = toStringSafe(v)
  if (!s) return null
  const t = Date.parse(s)
  return Number.isFinite(t) ? t : null
}

export function InvocationDetails(props: {
  operationId: string | null
  loading: boolean
  rows: DetailRow[]
  invocation: InvocationMeta | null
  onRefresh: () => void
}) {
  const styles = useStyles()
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const filteredRows = props.rows.filter((r) => toStringSafe(r.itemType).toLowerCase() !== 'request')

  const selectedRow = selectedIdx === null ? null : filteredRows[selectedIdx] ?? null
  const selectedTs = selectedRow ? toTimeMs(selectedRow.timestamp) : null
  const nextTs =
    selectedIdx === null || selectedIdx >= filteredRows.length - 1
      ? null
      : toTimeMs(filteredRows[selectedIdx + 1]?.timestamp)

  let approxDeltaMs: number | null = null
  if (selectedIdx !== null && selectedTs !== null) {
    if (nextTs !== null) {
      approxDeltaMs = Math.max(0, nextTs - selectedTs)
    } else if (props.invocation?.timestamp && Number.isFinite(props.invocation.durationMs)) {
      const invStart = Date.parse(props.invocation.timestamp)
      if (Number.isFinite(invStart)) {
        const invEnd = invStart + props.invocation.durationMs
        approxDeltaMs = Math.max(0, invEnd - selectedTs)
      }
    }
  }

  if (!props.operationId) {
    return (
      <div className={styles.wrap}>
        <Text weight="semibold">Invocation details</Text>
        <Text size={200} className={styles.subtle} block style={{ marginTop: 6 }}>
          Select an invocation on the left to view traces, dependencies, and exceptions.
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
              <TableHeaderCell>Log level</TableHeaderCell>
              <TableHeaderCell>Message</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((r, idx) => (
              <TableRow
                key={idx}
                className={`${styles.clickableRow} ${selectedIdx === idx ? styles.selectedRow : ''}`}
                onClick={() => setSelectedIdx(idx)}
              >
                <TableCell>
                  {r.timestamp ? new Date(String(r.timestamp)).toLocaleString() : ''}
                </TableCell>
                <TableCell>{toStringSafe(r.loglevel)}</TableCell>
                <TableCell>
                  <div className={styles.message}>{toStringSafe(r.message)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedIdx !== null} onOpenChange={(_, data) => (!data.open ? setSelectedIdx(null) : null)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody className={styles.dialogBody}>
            <div className={styles.dialogHeader}>
              <DialogTitle>{props.operationId}</DialogTitle>
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                aria-label="Close"
                onClick={() => setSelectedIdx(null)}
              />
            </div>
            <DialogContent className={styles.dialogContent}>
              <div className={styles.dialogLayout}>
                <div className={styles.metaGrid}>
                  <div>
                    <Text size={200} block>
                      Time
                    </Text>
                    <Text block>{selectedRow?.timestamp ? new Date(String(selectedRow.timestamp)).toLocaleString() : ''}</Text>
                  </div>
                  <div>
                    <Text size={200} block>
                      Result
                    </Text>
                    <Text block>
                      {props.invocation ? (props.invocation.success ? 'Success' : 'Failure') : ''}
                    </Text>
                  </div>
                  <div>
                    <Text size={200} block>
                      Duration (ms)
                    </Text>
                    <Text block>{approxDeltaMs === null ? '' : Math.round(approxDeltaMs)}</Text>
                  </div>
                  <div>
                    <Text size={200} block>
                      Log level
                    </Text>
                    <Text block>{toStringSafe(selectedRow?.loglevel)}</Text>
                  </div>
                  <div>
                    <Text size={200} block>
                      Item type
                    </Text>
                    <Text block>{toStringSafe(selectedRow?.itemType)}</Text>
                  </div>
                </div>

                <div className={styles.fullMessageSection}>
                  <Text size={200} block>
                    Full message
                  </Text>
                  <Textarea
                    readOnly
                    resize="none"
                    value={toStringSafe(selectedRow?.message)}
                    className={styles.fullMessageArea}
                  />
                </div>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}

