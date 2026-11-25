import { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { query } from '../../services/api'
import { date, Feedback, Pager, Status, useRemote } from './shared'

const targetLabels = { scholarship: 'Học bổng', mentor_verification: 'Hồ sơ mentor' }
const limit = 20

export default function ReviewAudit() {
  const [page, setPage] = useState(1)
  const [targetType, setTargetType] = useState('')
  const [decision, setDecision] = useState('')
  const filters = query({ target_type: targetType, decision, page, limit })
  const remote = useRemote(`/admin/review-audit?${filters}`)

  return (
    <>
      <h2>Nhật ký xét duyệt</h2>
      <CCard>
        <CCardBody>
          <CRow className="g-3 mb-3">
            <CCol sm={6} lg={4}>
              <CFormSelect
                label="Loại hồ sơ"
                id="audit-target-type"
                value={targetType}
                onChange={(event) => {
                  setTargetType(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Tất cả loại hồ sơ</option>
                {Object.entries(targetLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol sm={6} lg={4}>
              <CFormSelect
                label="Quyết định"
                id="audit-decision"
                value={decision}
                onChange={(event) => {
                  setDecision(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Tất cả quyết định</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Đã từ chối</option>
              </CFormSelect>
            </CCol>
          </CRow>
          <Feedback remote={remote} />
          {remote.data && (
            <>
              {remote.data.data.length ? (
                <CTable responsive>
                  <CTableHead>
                    <CTableRow>
                      {['Thời gian', 'Admin', 'Đối tượng', 'Quyết định', 'Ghi chú'].map((label) => (
                        <CTableHeaderCell key={label} scope="col">
                          {label}
                        </CTableHeaderCell>
                      ))}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {remote.data.data.map((entry) => (
                      <CTableRow key={entry.id}>
                        <CTableDataCell>{date(entry.created_at)}</CTableDataCell>
                        <CTableDataCell>#{entry.admin_id}</CTableDataCell>
                        <CTableDataCell>
                          {targetLabels[entry.target_type]} #{entry.target_id}
                        </CTableDataCell>
                        <CTableDataCell>
                          <Status value={entry.decision} />
                        </CTableDataCell>
                        <CTableDataCell className="text-break">{entry.note || '—'}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : (
                <p className="text-body-secondary mb-0">Chưa có quyết định phù hợp.</p>
              )}
              <Pager page={page} limit={limit} total={remote.data.total} onChange={setPage} />
            </>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}
