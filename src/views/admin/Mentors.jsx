import { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { api } from '../../services/api'
import { date, Feedback, labels, Pager, Status, useRemote } from './shared'
export default function Mentors() {
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const remote = useRemote(`/admin/mentors/verifications?status=${status}&page=${page}&limit=20`)
  const [dialog, setDialog] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function evidence(id) {
    setBusy(true)
    setError('')
    try {
      const blob = await api(`/admin/mentors/verifications/${id}/evidence`, { binary: true })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `mentor-evidence-${id}.pdf`
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  async function decide() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await api(`/admin/mentors/verifications/${dialog.item.id}/${dialog.action}`, {
        method: 'PATCH',
        body: { admin_note: note.trim() || null },
      })
      setMessage(result.message)
      setDialog(null)
      remote.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <h2>Xác minh mentor</h2>
      <p className="text-body-secondary">Kiểm tra hồ sơ và tải minh chứng trước khi quyết định.</p>
      {error && !dialog && <CAlert color="danger">{error}</CAlert>}
      {message && <CAlert color="success">{message}</CAlert>}
      <CCard>
        <CCardBody>
          <div className="d-flex gap-3 mb-3 align-items-end">
            <CFormSelect
              style={{ maxWidth: 300 }}
              id="mentor-status"
              label="Trạng thái hồ sơ"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              {['pending', 'approved', 'rejected', 'all'].map((s) => (
                <option key={s} value={s}>
                  {labels[s] || 'Tất cả'}
                </option>
              ))}
            </CFormSelect>
            <CButton color="secondary" variant="outline" onClick={remote.reload}>
              Làm mới
            </CButton>
          </div>
          <Feedback remote={remote} />
          {remote.data && (
            <>
              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    {['Ứng viên', 'Hồ sơ', 'Trạng thái', 'Thao tác'].map((v) => (
                      <CTableHeaderCell key={v}>{v}</CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {remote.data.data.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>
                        <strong>{item.full_name}</strong>
                        <div>{item.email}</div>
                        <div className="small">{item.university}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        Học bổng #{item.scholarship_id || '—'}
                        <div className="small">Nộp: {date(item.created_at)}</div>
                        <div className="small">Phí theo giờ: {item.hourly_rate ?? '—'}</div>
                        {item.admin_note && <div className="small">Ghi chú: {item.admin_note}</div>}
                      </CTableDataCell>
                      <CTableDataCell>
                        <Status value={item.status} />
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2 flex-wrap">
                          <CButton
                            size="sm"
                            color="primary"
                            variant="outline"
                            disabled={busy}
                            onClick={() => evidence(item.id)}
                          >
                            Tải minh chứng PDF
                          </CButton>
                          {item.status === 'pending' &&
                            ['approve', 'reject'].map((action) => (
                              <CButton
                                key={action}
                                size="sm"
                                color={action === 'approve' ? 'success' : 'danger'}
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  setDialog({ item, action })
                                  setNote('')
                                  setError('')
                                }}
                              >
                                {action === 'approve' ? 'Duyệt' : 'Từ chối'}
                              </CButton>
                            ))}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
              {!remote.data.data.length && (
                <p className="text-center py-4">Không có hồ sơ phù hợp.</p>
              )}
              <Pager page={page} total={remote.data.total} onChange={setPage} disabled={busy} />
            </>
          )}
        </CCardBody>
      </CCard>
      <CModal
        visible={!!dialog}
        onClose={() => !busy && setDialog(null)}
        backdrop="static"
        aria-labelledby="mentor-decision-title"
      >
        <CModalHeader closeButton={!busy}>
          <CModalTitle id="mentor-decision-title">
            {dialog?.action === 'approve' ? 'Duyệt mentor' : 'Từ chối hồ sơ'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          <p>
            {dialog?.item.full_name} · {dialog?.item.email}
          </p>
          <CFormTextarea
            id="mentor-note"
            label="Ghi chú xét duyệt"
            maxLength={2000}
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" disabled={busy} onClick={() => setDialog(null)}>
            Hủy
          </CButton>
          <CButton color="primary" disabled={busy} onClick={decide}>
            {busy ? 'Đang xử lý…' : 'Xác nhận'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}
