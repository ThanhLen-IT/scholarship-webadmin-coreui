import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CForm,
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
import { api, query } from '../../services/api'
import { date, Feedback, Pager, useRemote } from './shared'

const limit = 20
const statusLabels = { open: 'Chờ phản hồi', resolved: 'Đã giải quyết' }

function TicketList({ status, page, onPageChange, onSelect }) {
  const remote = useRemote(`/admin/support/tickets?${query({ status, page, limit })}`)

  return (
    <>
      <Feedback remote={remote} />
      {remote.data && (
        <>
          {remote.data.data.length ? (
            <CTable responsive align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">Chủ đề</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Người gửi</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Thời gian gửi</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Trạng thái</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Thao tác</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {remote.data.data.map((ticket) => (
                  <CTableRow key={ticket.id}>
                    <CTableDataCell className="text-break">
                      <span className="text-body-secondary me-2">#{ticket.id}</span>
                      {ticket.subject}
                    </CTableDataCell>
                    <CTableDataCell>#{ticket.user_id}</CTableDataCell>
                    <CTableDataCell>{date(ticket.created_at)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={ticket.status === 'resolved' ? 'success' : 'warning'}>
                        {statusLabels[ticket.status] || ticket.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        size="sm"
                        color="primary"
                        variant="outline"
                        onClick={() => onSelect(ticket)}
                      >
                        Xem chi tiết
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          ) : (
            <p className="text-body-secondary mb-0">Không có yêu cầu hỗ trợ phù hợp.</p>
          )}
          <Pager page={page} limit={limit} total={remote.data.total} onChange={onPageChange} />
        </>
      )}
    </>
  )
}

TicketList.propTypes = {
  status: PropTypes.string.isRequired,
  page: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
}

function TicketDetails({ ticket, onClose, onReplied }) {
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canReply = ticket.status === 'open'

  async function sendReply(event) {
    event.preventDefault()
    const response = reply.trim()
    if (!canReply || !response || busy) return
    setBusy(true)
    setError('')
    try {
      await api(`/admin/support/tickets/${ticket.id}/reply`, {
        method: 'PATCH',
        body: { response },
      })
      onReplied()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <CModal
      visible
      onClose={() => {
        if (!busy) onClose()
      }}
      aria-labelledby="support-ticket-title"
      backdrop="static"
      keyboard={!busy}
      scrollable
    >
      <CModalHeader closeButton={!busy}>
        <CModalTitle id="support-ticket-title">Yêu cầu hỗ trợ #{ticket.id}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <h3 className="h5 text-break">{ticket.subject}</h3>
        <p className="small text-body-secondary">
          Người gửi #{ticket.user_id} · {date(ticket.created_at)}
        </p>
        <p className="text-break" style={{ whiteSpace: 'pre-wrap' }}>
          {ticket.message}
        </p>
        {ticket.admin_response && (
          <>
            <h4 className="h6">Phản hồi của quản trị viên</h4>
            <p className="text-break" style={{ whiteSpace: 'pre-wrap' }}>
              {ticket.admin_response}
            </p>
          </>
        )}
        {canReply && (
          <CForm id="support-reply-form" onSubmit={sendReply}>
            {error && (
              <CAlert color="danger" role="alert">
                {error}
              </CAlert>
            )}
            <CFormTextarea
              id="support-reply"
              label="Phản hồi"
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              rows={4}
              required
              maxLength={5000}
              disabled={busy}
              text="Gửi phản hồi sẽ đánh dấu yêu cầu đã giải quyết và thông báo cho người gửi."
            />
          </CForm>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={busy}>
          Đóng
        </CButton>
        {canReply && (
          <CButton
            color="primary"
            type="submit"
            form="support-reply-form"
            disabled={busy || !reply.trim()}
          >
            {busy ? 'Đang gửi…' : 'Gửi phản hồi'}
          </CButton>
        )}
      </CModalFooter>
    </CModal>
  )
}

TicketDetails.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.number.isRequired,
    user_id: PropTypes.number.isRequired,
    subject: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    admin_response: PropTypes.string,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onReplied: PropTypes.func.isRequired,
}

export default function Support() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [ticket, setTicket] = useState(null)
  const [message, setMessage] = useState('')

  return (
    <>
      <h2>Hộp thư hỗ trợ</h2>
      {message && (
        <CAlert color="success" role="status">
          {message}
        </CAlert>
      )}
      <CCard>
        <CCardBody>
          <CFormSelect
            className="mb-3"
            style={{ maxWidth: '18rem' }}
            label="Trạng thái"
            id="support-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </CFormSelect>
          <TicketList
            key={`${status}:${page}:${refresh}`}
            status={status}
            page={page}
            onPageChange={setPage}
            onSelect={(selected) => {
              setMessage('')
              setTicket(selected)
            }}
          />
        </CCardBody>
      </CCard>
      {ticket && (
        <TicketDetails
          ticket={ticket}
          onClose={() => setTicket(null)}
          onReplied={() => {
            setTicket(null)
            setMessage('Đã gửi phản hồi.')
            if (status === 'open') setPage(1)
            setRefresh((revision) => revision + 1)
          }}
        />
      )}
    </>
  )
}
