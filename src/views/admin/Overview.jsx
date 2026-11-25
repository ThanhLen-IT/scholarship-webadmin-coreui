import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { CCard, CCardBody, CCol, CRow } from '@coreui/react'
import { useAuth } from '../../auth/AuthContext'
import { date, Feedback, Status, useRemote } from './shared'

const numberFormat = new Intl.NumberFormat('vi-VN')

function OverviewCard({ title, to, linkLabel, remote, children }) {
  return (
    <CCol sm={6} xl={3}>
      <CCard className="h-100">
        <CCardBody className="d-flex flex-column">
          <h3 className="h6">{title}</h3>
          <Feedback remote={remote} />
          {remote.data && <div className="mb-3">{children}</div>}
          <Link className="mt-auto align-self-start" to={to}>
            {linkLabel}
          </Link>
        </CCardBody>
      </CCard>
    </CCol>
  )
}

OverviewCard.propTypes = {
  title: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  linkLabel: PropTypes.string.isRequired,
  remote: PropTypes.object.isRequired,
  children: PropTypes.node,
}

function formatTotal(remote) {
  const total = remote.data?.total
  return total == null ? 'Chưa có số liệu' : numberFormat.format(total)
}

export default function Overview() {
  const { user } = useAuth()
  const pending = useRemote('/admin/scholarships?status=pending&limit=1')
  const published = useRemote('/admin/scholarships?status=published&limit=1')
  const mentors = useRemote('/admin/mentors/verifications?status=pending&limit=1')
  const crawler = useRemote('/admin/crawler/logs?limit=1')
  const latestRun = crawler.data?.data?.[0]

  return (
    <>
      <h2>Tổng quan</h2>
      {user.full_name && <p className="text-body-secondary mb-4">Xin chào, {user.full_name}</p>}
      <CRow className="g-3">
        <OverviewCard
          title="Học bổng chờ duyệt"
          remote={pending}
          to="/scholarships?status=pending"
          linkLabel="Xem học bổng chờ duyệt"
        >
          <p className="fs-3 fw-semibold mb-0">{formatTotal(pending)}</p>
        </OverviewCard>
        <OverviewCard
          title="Học bổng đã công khai"
          remote={published}
          to="/scholarships?status=published"
          linkLabel="Xem học bổng đã công khai"
        >
          <p className="fs-3 fw-semibold mb-0">{formatTotal(published)}</p>
        </OverviewCard>
        <OverviewCard
          title="Hồ sơ mentor chờ xác minh"
          remote={mentors}
          to="/mentor-verifications"
          linkLabel="Xem hồ sơ mentor"
        >
          <p className="fs-3 fw-semibold mb-0">{formatTotal(mentors)}</p>
        </OverviewCard>
        <OverviewCard
          title="Lượt crawl gần nhất"
          remote={crawler}
          to="/crawler"
          linkLabel="Xem lịch sử crawler"
        >
          {latestRun ? (
            <>
              <Status value={latestRun.status} />
              <div className="mt-2 text-break">{latestRun.source_name}</div>
              <div className="small text-body-secondary">{date(latestRun.started_at)}</div>
            </>
          ) : (
            <p className="text-body-secondary mb-0">Chưa có lịch sử chạy.</p>
          )}
        </OverviewCard>
      </CRow>
    </>
  )
}
