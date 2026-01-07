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
import { CheckmarkCircle20Filled, DismissCircle20Filled } from '@fluentui/react-icons'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  statusCell: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  okIcon: { color: '#107c10' },
  failIcon: { color: '#a4262c' },
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
  resizableHeaderCell: {
    position: 'relative',
    userSelect: 'none',
  },
  resizeHandle: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    width: '10px',
    cursor: 'col-resize',
    touchAction: 'none',
  },
})

type ColId = 'date' | 'status' | 'result' | 'duration' | 'operationId' | 'matches'

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

  const columns = useMemo(() => {
    const base: Array<{ id: ColId; label: string; width: number; minWidth: number }> = [
      { id: 'date', label: 'Date', width: 190, minWidth: 140 },
      { id: 'status', label: 'Status', width: 120, minWidth: 100 },
      { id: 'result', label: 'Result', width: 90, minWidth: 70 },
      { id: 'duration', label: 'Duration (ms)', width: 120, minWidth: 110 },
      { id: 'operationId', label: 'Operation ID', width: 320, minWidth: 180 },
    ]
    if (props.mode === 'search') base.push({ id: 'matches', label: 'Matches', width: 90, minWidth: 80 })
    return base
  }, [props.mode])

  const defaultWidths = useMemo(() => {
    const init: Partial<Record<ColId, number>> = {}
    for (const c of columns) init[c.id] = c.width
    return init
  }, [columns])

  const [colWidths, setColWidths] = useState<Partial<Record<ColId, number>>>({})

  function getWidth(id: ColId, fallback: number): number {
    return colWidths[id] ?? defaultWidths[id] ?? fallback
  }

  const dragRef = useRef<null | {
    colId: ColId
    startX: number
    startWidth: number
    minWidth: number
  }>(null)

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current
      if (!d) return
      const delta = e.clientX - d.startX
      const nextWidth = Math.max(d.minWidth, d.startWidth + delta)
      setColWidths((prev) => ({ ...prev, [d.colId]: nextWidth }))
    }

    function onUp() {
      dragRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  function cellStyle(id: ColId, minWidth: number): CSSProperties {
    const w = getWidth(id, minWidth)
    return {
      width: w,
      minWidth,
      maxWidth: w,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }
  }

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
        <Table size="small" aria-label="Invocations table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHeaderCell
                  key={c.id}
                  className={styles.resizableHeaderCell}
                  style={cellStyle(c.id, c.minWidth)}
                >
                  {c.label}
                  <div
                    className={styles.resizeHandle}
                    onPointerDown={(e) => {
                      dragRef.current = { colId: c.id, startX: e.clientX, startWidth: getWidth(c.id, c.width), minWidth: c.minWidth }
                      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                    }}
                  />
                </TableHeaderCell>
              ))}
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
                  <TableCell style={cellStyle('date', 140)}>{new Date(r.timestamp).toLocaleString()}</TableCell>
                  <TableCell style={cellStyle('status', 100)}>
                    <span className={styles.statusCell}>
                      {r.success ? (
                        <CheckmarkCircle20Filled className={styles.okIcon} />
                      ) : (
                        <DismissCircle20Filled className={styles.failIcon} />
                      )}
                      <span>{r.success ? 'Success' : 'Failure'}</span>
                    </span>
                  </TableCell>
                  <TableCell style={cellStyle('result', 70)}>{r.resultCode}</TableCell>
                  <TableCell style={cellStyle('duration', 110)}>{Math.round(r.durationMs)}</TableCell>
                  <TableCell style={cellStyle('operationId', 180)}>
                    <Text size={200} className={styles.subtle}>
                      {r.operationId}
                    </Text>
                  </TableCell>
                  {props.mode === 'search' ? <TableCell style={cellStyle('matches', 80)}>{r.matchCount ?? ''}</TableCell> : null}
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

