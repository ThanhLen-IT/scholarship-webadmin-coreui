import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { api, query } from '../../services/api'
import { Feedback, labels, Pager, Status, useRemote } from './shared'
const levels = {
  bachelor: 'Cử nhân',
  master: 'Thạc sĩ',
  doctoral: 'Tiến sĩ',
  all: 'Tất cả bậc học',
  other: 'Khác / trao đổi',
  unknown: 'Chưa xác định',
}
const fields = {
  title: 'Tên học bổng',
  organization: 'Tổ chức',
  country: 'Quốc gia đến học',
  continent: 'Châu lục',
  type: 'Loại học bổng',
  deadline: 'Hạn nộp',
  application_link: 'Link ứng tuyển',
  image_url: 'URL ảnh',
  source_name: 'Tên nguồn',
  source_url: 'URL nguồn',
}
const textFields = {
  description: 'Mô tả',
  requirements: 'Điều kiện',
  benefits: 'Quyền lợi',
  content_html: 'Nội dung HTML',
}
const empty = () => ({
  ...Object.fromEntries([...Object.keys(fields), ...Object.keys(textFields)].map((k) => [k, ''])),
  majors: '',
  study_levels: ['unknown'],
})
export default function Scholarships() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    search: '',
    status: ['pending', 'published', 'rejected', 'archived'].includes(searchParams.get('status'))
      ? searchParams.get('status')
      : '',
    country: '',
    type: '',
    study_level: '',
    deadline_from: '',
    deadline_to: '',
    sort: 'newest',
  })
  const [applied, setApplied] = useState(filters)
  const [page, setPage] = useState(1)
  const remote = useRemote(`/admin/scholarships?${query({ ...applied, page, limit: 20 })}`)
  const [editor, setEditor] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [reason, setReason] = useState('')
  async function openEditor(id) {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const item = id ? (await api(`/admin/scholarships/${id}`)).data : empty()
      setEditor({
        ...empty(),
        ...item,
        deadline: item.deadline?.slice(0, 10) || '',
        majors: Array.isArray(item.majors) ? item.majors.join('\n') : '',
        study_levels: item.study_levels || ['unknown'],
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  function change(key, value) {
    setEditor((current) => ({ ...current, [key]: value }))
  }
  async function save(event) {
    event.preventDefault()
    if (!editor.study_levels.length) {
      setError('Chọn ít nhất một bậc học.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const body = Object.fromEntries(
        [...Object.keys(fields), ...Object.keys(textFields)].map((k) => [k, editor[k] || null]),
      )
      body.study_levels = editor.study_levels
      body.majors = editor.majors
        .split(/[,;\n]/)
        .map((v) => v.trim())
        .filter(Boolean)
      await api(`/admin/scholarships${editor.id ? `/${editor.id}` : ''}`, {
        method: editor.id ? 'PUT' : 'POST',
        body,
      })
      setEditor(null)
      setMessage('Đã lưu học bổng. Học bổng mới ở trạng thái chờ duyệt.')
      remote.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  async function act() {
    if (dialog.action === 'reject' && !reason.trim()) {
      setError('Nhập lý do từ chối.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api(
        `/admin/scholarships/${dialog.item.id}${dialog.action === 'delete' ? '' : `/${dialog.action}`}`,
        {
          method: dialog.action === 'delete' ? 'DELETE' : 'PATCH',
          ...(dialog.action === 'reject' ? { body: { rejection_reason: reason.trim() } } : {}),
        },
      )
      setDialog(null)
      setMessage('Đã cập nhật học bổng.')
      remote.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  const actions = {
    approve: 'Duyệt và công khai',
    reject: 'Từ chối',
    archive: 'Lưu trữ',
    delete: 'Xóa vĩnh viễn',
  }
  return (
    <>
      <div className="d-flex justify-content-between mb-3 gap-3">
        <h2>Quản lý học bổng</h2>
        <CButton color="primary" disabled={busy} onClick={() => openEditor()}>
          Thêm học bổng
        </CButton>
      </div>
      {message && <CAlert color="success">{message}</CAlert>}
      {error && !editor && !dialog && <CAlert color="danger">{error}</CAlert>}
      <CCard className="mb-4">
        <CCardBody>
          <CForm
            onSubmit={(e) => {
              e.preventDefault()
              setPage(1)
              setApplied({ ...filters })
            }}
          >
            <CRow className="g-3">
              {Object.entries({
                search: 'Tên hoặc tổ chức',
                country: 'Quốc gia',
                type: 'Loại học bổng',
                deadline_from: 'Deadline từ',
                deadline_to: 'Deadline đến',
              }).map(([key, label]) => (
                <CCol md={key === 'search' ? 4 : 2} key={key}>
                  <CFormInput
                    id={`filter-${key}`}
                    label={label}
                    type={key.startsWith('deadline') ? 'date' : 'text'}
                    value={filters[key]}
                    onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                  />
                </CCol>
              ))}
              <CCol md={3}>
                <CFormSelect
                  id="scholarship-status"
                  label="Trạng thái"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">Tất cả trạng thái</option>
                  {['pending', 'published', 'rejected', 'archived'].map((s) => (
                    <option key={s} value={s}>
                      {labels[s]}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  id="scholarship-level"
                  label="Bậc học"
                  value={filters.study_level}
                  onChange={(e) => setFilters({ ...filters, study_level: e.target.value })}
                >
                  <option value="">Tất cả</option>
                  {Object.entries(levels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  id="scholarship-sort"
                  label="Sắp xếp"
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="deadline_asc">Deadline gần nhất</option>
                  <option value="deadline_desc">Deadline xa nhất</option>
                </CFormSelect>
              </CCol>
              <CCol className="d-flex align-items-end">
                <CButton type="submit" color="primary">
                  Tìm kiếm / lọc
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>
      <Feedback remote={remote} />
      {remote.data && (
        <CCard>
          <CCardBody>
            <CTable responsive hover>
              <CTableHead>
                <CTableRow>
                  {['Học bổng', 'Quốc gia / bậc học', 'Deadline', 'Trạng thái', 'Thao tác'].map(
                    (v) => (
                      <CTableHeaderCell key={v}>{v}</CTableHeaderCell>
                    ),
                  )}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {remote.data.data.map((item) => (
                  <CTableRow key={item.id}>
                    <CTableDataCell>
                      <strong>{item.title}</strong>
                      <div className="small text-body-secondary">{item.organization}</div>
                      {item.rejection_reason && (
                        <div className="small text-danger">{item.rejection_reason}</div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      {item.country || '—'}
                      <div className="small">
                        {item.study_levels?.map((v) => levels[v] || v).join(', ')}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>{item.deadline?.slice(0, 10) || '—'}</CTableDataCell>
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
                          onClick={() => openEditor(item.id)}
                        >
                          Xem / sửa
                        </CButton>
                        {Object.entries(actions)
                          .filter(
                            ([key]) =>
                              key === 'delete' ||
                              (key === 'approve' || key === 'reject'
                                ? item.status === 'pending'
                                : item.status === 'published'),
                          )
                          .map(([key, label]) => (
                            <CButton
                              key={key}
                              size="sm"
                              color={key === 'delete' || key === 'reject' ? 'danger' : 'secondary'}
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                setDialog({ item, action: key })
                                setReason('')
                                setError('')
                              }}
                            >
                              {label}
                            </CButton>
                          ))}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
            {!remote.data.data.length && (
              <p className="text-center py-4">Không có học bổng phù hợp.</p>
            )}
            <Pager page={page} total={remote.data.total} onChange={setPage} disabled={busy} />
          </CCardBody>
        </CCard>
      )}
      <CModal
        size="xl"
        visible={!!editor}
        onClose={() => !busy && setEditor(null)}
        backdrop="static"
        aria-labelledby="scholarship-editor-title"
      >
        <CModalHeader closeButton={!busy}>
          <CModalTitle id="scholarship-editor-title">
            {editor?.id ? 'Chi tiết / chỉnh sửa học bổng' : 'Thêm học bổng'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {editor && (
            <CForm id="scholarship-form" onSubmit={save}>
              {error && <CAlert color="danger">{error}</CAlert>}
              <CRow className="g-3">
                {Object.entries(fields).map(([key, label]) => (
                  <CCol md={6} key={key}>
                    <CFormInput
                      id={`editor-${key}`}
                      label={label}
                      required={key === 'title'}
                      maxLength={
                        key === 'title' || key === 'organization'
                          ? 255
                          : ['country', 'continent', 'type'].includes(key)
                            ? 100
                            : key === 'source_name'
                              ? 150
                              : undefined
                      }
                      type={
                        key === 'deadline'
                          ? 'date'
                          : ['application_link', 'image_url', 'source_url'].includes(key)
                            ? 'url'
                            : 'text'
                      }
                      value={editor[key] || ''}
                      onChange={(e) => change(key, e.target.value)}
                    />
                  </CCol>
                ))}
                <CCol xs={12}>
                  <fieldset>
                    <legend className="fs-6">Bậc học (chọn ít nhất một)</legend>
                    {Object.entries(levels).map(([key, label]) => (
                      <CFormCheck
                        inline
                        key={key}
                        id={`level-${key}`}
                        label={label}
                        checked={editor.study_levels.includes(key)}
                        onChange={(e) =>
                          change(
                            'study_levels',
                            e.target.checked
                              ? [...editor.study_levels, key]
                              : editor.study_levels.filter((v) => v !== key),
                          )
                        }
                      />
                    ))}
                  </fieldset>
                </CCol>
                <CCol xs={12}>
                  <CFormTextarea
                    id="scholarship-majors"
                    label="Ngành học (mỗi dòng một ngành hoặc phân cách bằng dấu phẩy)"
                    rows={3}
                    value={editor.majors}
                    onChange={(e) => change('majors', e.target.value)}
                  />
                </CCol>
                {Object.entries(textFields).map(([key, label]) => (
                  <CCol xs={12} key={key}>
                    <CFormTextarea
                      id={`editor-${key}`}
                      label={label}
                      rows={key === 'content_html' ? 6 : 4}
                      value={editor[key] || ''}
                      onChange={(e) => change(key, e.target.value)}
                    />
                  </CCol>
                ))}
                {editor.original_content_html && (
                  <CCol xs={12}>
                    <CFormTextarea
                      id="scholarship-original-html"
                      label="HTML gốc từ nguồn (chỉ đọc)"
                      rows={4}
                      value={editor.original_content_html}
                      readOnly
                    />
                  </CCol>
                )}
              </CRow>
            </CForm>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" disabled={busy} onClick={() => setEditor(null)}>
            Đóng
          </CButton>
          <CButton color="primary" type="submit" form="scholarship-form" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={!!dialog}
        onClose={() => !busy && setDialog(null)}
        backdrop="static"
        aria-labelledby="scholarship-action-title"
      >
        <CModalHeader closeButton={!busy}>
          <CModalTitle id="scholarship-action-title">{actions[dialog?.action]}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          <p>{dialog?.item.title}</p>
          {dialog?.action === 'delete' && (
            <p>Học bổng sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.</p>
          )}
          {dialog?.action === 'reject' && (
            <CFormTextarea
              id="scholarship-reject-reason"
              label="Lý do từ chối"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" disabled={busy} onClick={() => setDialog(null)}>
            Hủy
          </CButton>
          <CButton
            color="danger"
            disabled={busy || (dialog?.action === 'reject' && !reason.trim())}
            onClick={act}
          >
            {busy ? 'Đang xử lý…' : 'Xác nhận'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}
