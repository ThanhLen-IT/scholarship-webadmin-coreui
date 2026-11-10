import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CBadge, CButton, CSpinner } from '@coreui/react'
import { api } from '../../services/api'
export const labels = {
  pending: 'Chờ duyệt',
  published: 'Đã công khai',
  rejected: 'Đã từ chối',
  archived: 'Đã lưu trữ',
  approved: 'Đã duyệt',
  running: 'Đang chạy',
  completed: 'Hoàn thành',
  completed_with_errors: 'Hoàn thành, có lỗi',
  failed: 'Thất bại',
}
export function Status({ value }) {
  return (
    <CBadge
      color={
        {
          pending: 'warning',
          published: 'success',
          approved: 'success',
          rejected: 'danger',
          failed: 'danger',
          running: 'info',
        }[value] || 'secondary'
      }
    >
      {labels[value] || value || 'Chưa chạy'}
    </CBadge>
  )
}
Status.propTypes = { value: PropTypes.string }
export function useRemote(path, interval = 0) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const data = await api(path, { signal: controller.signal })
        if (!controller.signal.aborted) setState({ data, error: '', loading: false })
      } catch (err) {
        if (!controller.signal.aborted) setState({ data: null, error: err.message, loading: false })
      }
    }
    load()
    const timer = interval ? setInterval(load, interval) : null
    return () => {
      controller.abort()
      if (timer) clearInterval(timer)
    }
  }, [path, revision, interval])
  return { ...state, reload: () => setRevision((v) => v + 1) }
}
export function Feedback({ remote }) {
  if (remote.loading)
    return (
      <div className="py-4 text-center">
        <CSpinner />
        <p>Đang tải…</p>
      </div>
    )
  if (remote.error)
    return (
      <CAlert color="danger">
        {remote.error}{' '}
        <CButton size="sm" color="danger" variant="outline" onClick={remote.reload}>
          Thử lại
        </CButton>
      </CAlert>
    )
  return null
}
Feedback.propTypes = { remote: PropTypes.object.isRequired }
export function Pager({ page, total, limit = 20, onChange, disabled = false }) {
  const pages = Math.max(1, Math.ceil(Number(total || 0) / limit))
  return (
    <div className="d-flex align-items-center gap-3 my-3 flex-wrap">
      <span>
        {total || 0} bản ghi · Trang {page}/{pages}
      </span>
      <CButton
        size="sm"
        color="secondary"
        variant="outline"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Trước
      </CButton>
      <CButton
        size="sm"
        color="secondary"
        variant="outline"
        disabled={disabled || page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </CButton>
    </div>
  )
}
Pager.propTypes = {
  page: PropTypes.number,
  total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  limit: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
}
export const date = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—')
