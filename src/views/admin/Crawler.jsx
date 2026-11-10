import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CFormSelect,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { api } from '../../services/api'
import { date, Feedback, Pager, Status, useRemote } from './shared'
export default function Crawler() {
  const sources = useRemote('/admin/crawler/sources')
  const status = useRemote('/admin/crawler/status', 5000)
  const [page, setPage] = useState(1)
  const logs = useRemote(`/admin/crawler/logs?page=${page}&limit=20`, 10000)
  const [sourceKey, setSourceKey] = useState('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const run = status.data?.data
  async function start() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await api('/admin/crawler/run', { method: 'POST', body: { sourceKey } })
      setMessage(result.message)
      status.reload()
      logs.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <h2>Crawler học bổng</h2>
      <p className="text-body-secondary">
        Dữ liệu thu thập được chuyển vào danh sách học bổng chờ duyệt.
      </p>
      {error && <CAlert color="danger">{error}</CAlert>}
      {message && <CAlert color="success">{message}</CAlert>}
      <CCard className="mb-4">
        <CCardBody>
          <h3 className="h5">Nguồn thu thập</h3>
          <Feedback remote={sources} />
          {sources.data && (
            <>
              <div className="d-flex gap-3 mb-3 flex-wrap align-items-end">
                <CFormSelect
                  style={{ maxWidth: 420 }}
                  id="crawler-source"
                  label="Chọn nguồn"
                  value={sourceKey}
                  disabled={busy || run?.status === 'running'}
                  onChange={(e) => setSourceKey(e.target.value)}
                >
                  <option value="all">Tất cả nguồn đang bật</option>
                  {sources.data.data.map((s) => (
                    <option key={s.key} value={s.key} disabled={!s.enabled}>
                      {s.sourceName}
                      {s.enabled ? '' : ' (đã tắt)'}
                    </option>
                  ))}
                </CFormSelect>
                <CButton
                  color="primary"
                  disabled={
                    busy ||
                    status.loading ||
                    !!status.error ||
                    run?.status === 'running' ||
                    !sources.data.data.some((s) => s.enabled)
                  }
                  onClick={start}
                >
                  {busy || run?.status === 'running' ? 'Đang chạy…' : 'Chạy crawler'}
                </CButton>
                <Link to="/scholarships?status=pending">Duyệt học bổng</Link>
              </div>
              <CTable responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Nguồn</CTableHeaderCell>
                    <CTableHeaderCell>Quốc gia mặc định</CTableHeaderCell>
                    <CTableHeaderCell>Giới hạn</CTableHeaderCell>
                    <CTableHeaderCell>Trạng thái</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {sources.data.data.map((s) => (
                    <CTableRow key={s.key}>
                      <CTableDataCell>
                        {s.sourceName}
                        <div className="small text-break">{s.sourceUrl}</div>
                      </CTableDataCell>
                      <CTableDataCell>{s.defaults?.country || '—'}</CTableDataCell>
                      <CTableDataCell>{s.maxItems || '—'}</CTableDataCell>
                      <CTableDataCell>{s.enabled ? 'Đang bật' : 'Đã tắt'}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </>
          )}
        </CCardBody>
      </CCard>
      <CCard className="mb-4">
        <CCardBody>
          <h3 className="h5">Lượt chạy hiện tại</h3>
          <Feedback remote={status} />
          {status.data && (
            <>
              <Status value={run?.status} />
              {run && (
                <>
                  <p className="mt-3">
                    Nguồn: {run.sourceKey} · Bắt đầu: {date(run.startedAt)} · Kết thúc:{' '}
                    {date(run.finishedAt)}
                  </p>
                  {run.error && <CAlert color="danger">{run.error}</CAlert>}
                  {run.results?.map((r, i) => (
                    <p key={i}>
                      {r.sourceName || r.sourceKey || 'Nguồn'}: tìm thấy {r.found ?? 0}, lưu{' '}
                      {r.saved ?? 0}, lỗi {r.failed ?? 0}
                    </p>
                  ))}
                </>
              )}
            </>
          )}
        </CCardBody>
      </CCard>
      <CCard>
        <CCardBody>
          <div className="d-flex justify-content-between">
            <h3 className="h5">Lịch sử chạy</h3>
            <CButton size="sm" color="secondary" onClick={logs.reload}>
              Làm mới
            </CButton>
          </div>
          <Feedback remote={logs} />
          {logs.data && (
            <>
              <CTable responsive>
                <CTableHead>
                  <CTableRow>
                    {['Nguồn', 'Bắt đầu', 'Kết thúc', 'Tìm thấy / Lưu / Lỗi', 'Trạng thái'].map(
                      (v) => (
                        <CTableHeaderCell key={v}>{v}</CTableHeaderCell>
                      ),
                    )}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {logs.data.data.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>
                        {item.source_name}
                        {item.error_message && (
                          <div className="small text-danger">{item.error_message}</div>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>{date(item.started_at)}</CTableDataCell>
                      <CTableDataCell>{date(item.finished_at)}</CTableDataCell>
                      <CTableDataCell>
                        {item.found_count} / {item.saved_count} / {item.failed_count}
                      </CTableDataCell>
                      <CTableDataCell>
                        <Status value={item.status} />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
              {!logs.data.data.length && <p>Chưa có lịch sử chạy.</p>}
              <Pager page={page} total={logs.data.pagination.total} onChange={setPage} />
            </>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}
