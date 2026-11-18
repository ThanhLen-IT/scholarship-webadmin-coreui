import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { CChartLine } from '@coreui/react-chartjs'
import PropTypes from 'prop-types'
import { date, Feedback, useRemote } from './shared'

const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })
const hour = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const chartOptions = {
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: { y: { beginAtZero: true } },
}

export default function Monitoring() {
  const remote = useRemote('/admin/monitoring', 30000)
  const monitoring = remote.data?.data

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Giám sát hệ thống</h2>
        <CButton color="secondary" variant="outline" onClick={remote.reload}>
          Làm mới
        </CButton>
      </div>
      <Feedback remote={remote} />
      {monitoring && <Metrics data={monitoring} />}
    </>
  )
}

function Metrics({ data: { services, summary, series, recentErrors, startedAt, collectedAt } }) {
  const errorRate = summary.requests
    ? number.format((100 * summary.serverErrors) / summary.requests) + '%'
    : '—'
  const labels = series.map((point) => hour.format(new Date(point.from)))
  const cards = [
    ['Yêu cầu API', number.format(summary.requests)],
    ['Phản hồi 4xx', number.format(summary.clientErrors)],
    ['Phản hồi 5xx', `${number.format(summary.serverErrors)} · ${errorRate}`],
    ['Độ trễ p95 ước tính', summary.p95Ms == null ? '—' : `${number.format(summary.p95Ms)} ms`],
  ]

  return (
    <>
      <div className="d-flex flex-wrap gap-3 mb-2">
        <span>
          Backend{' '}
          <CBadge color={services.backend === 'up' ? 'success' : 'danger'}>
            {services.backend === 'up' ? 'Đang chạy' : 'Không khả dụng'}
          </CBadge>
        </span>
        <span>
          PostgreSQL{' '}
          <CBadge color={services.database === 'ready' ? 'success' : 'danger'}>
            {services.database === 'ready' ? 'Sẵn sàng' : 'Mất kết nối'}
          </CBadge>
        </span>
      </div>
      <p className="small text-body-secondary">
        Số liệu tối đa 24 khung giờ của tiến trình hiện tại. Khởi động {date(startedAt)} · Cập nhật{' '}
        {date(collectedAt)}.
      </p>
      <CRow className="g-3 mb-4">
        {cards.map(([label, value]) => (
          <CCol sm={6} xl={3} key={label}>
            <CCard className="h-100">
              <CCardBody>
                <h3 className="h6">{label}</h3>
                <p className="fs-4 fw-semibold mb-0">{value}</p>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>
      {summary.requests ? (
        <CRow className="g-3 mb-4">
          <CCol lg={6}>
            <CCard className="h-100">
              <CCardBody>
                <h3 className="h6">Lưu lượng và mã lỗi theo giờ</h3>
                <div style={{ height: 260 }}>
                  <CChartLine
                    aria-label="Lưu lượng API, phản hồi 4xx và 5xx theo giờ"
                    data={{
                      labels,
                      datasets: [
                        {
                          label: 'Yêu cầu',
                          borderColor: '#1685c7',
                          data: series.map((p) => p.requests),
                        },
                        {
                          label: '4xx',
                          borderColor: '#c38116',
                          data: series.map((p) => p.clientErrors),
                        },
                        {
                          label: '5xx',
                          borderColor: '#d6404e',
                          data: series.map((p) => p.serverErrors),
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol lg={6}>
            <CCard className="h-100">
              <CCardBody>
                <h3 className="h6">Độ trễ p95 theo giờ</h3>
                <div style={{ height: 260 }}>
                  <CChartLine
                    aria-label="Độ trễ p95 ước tính theo giờ, đơn vị mili giây"
                    data={{
                      labels,
                      datasets: [
                        {
                          label: 'p95 (ms)',
                          borderColor: '#744bd1',
                          data: series.map((p) => p.p95Ms),
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      ) : (
        <p>Chưa ghi nhận yêu cầu API trong khoảng theo dõi.</p>
      )}
      <CCard>
        <CCardBody>
          <h3 className="h6">Lỗi máy chủ gần đây</h3>
          {recentErrors.length ? (
            <CTable responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  {['Thời gian', 'Endpoint', 'HTTP', 'Độ trễ', 'Mã yêu cầu'].map((label) => (
                    <CTableHeaderCell key={label} scope="col">
                      {label}
                    </CTableHeaderCell>
                  ))}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {recentErrors.map((error) => (
                  <CTableRow key={error.request_id}>
                    <CTableDataCell>{date(error.timestamp)}</CTableDataCell>
                    <CTableDataCell>
                      {error.method} {error.route}
                    </CTableDataCell>
                    <CTableDataCell>{error.status}</CTableDataCell>
                    <CTableDataCell>{number.format(error.duration_ms)} ms</CTableDataCell>
                    <CTableDataCell>
                      <code>{error.request_id}</code>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          ) : (
            <p className="mb-0">Chưa ghi nhận lỗi 5xx.</p>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

Metrics.propTypes = { data: PropTypes.object.isRequired }
