import { Link } from 'react-router-dom'
import { CCard, CCardBody, CCol, CRow } from '@coreui/react'
import { useAuth } from '../../auth/AuthContext'
export default function Overview() {
  const { user } = useAuth()
  return (
    <>
      <h2>Xin chào, {user.full_name}</h2>
      <p className="text-body-secondary mb-4">
        Quản lý nội dung và xét duyệt hồ sơ Scholarship Gateway.
      </p>
      <CRow className="g-4">
        {[
          ['/scholarships', 'Học bổng', 'Tạo, chỉnh sửa, duyệt và lưu trữ học bổng.'],
          ['/crawler', 'Crawler', 'Thu thập học bổng và theo dõi lịch sử chạy.'],
          ['/mentor-verifications', 'Xác minh mentor', 'Xem minh chứng, duyệt hoặc từ chối hồ sơ.'],
        ].map(([to, title, description]) => (
          <CCol md={4} key={to}>
            <CCard className="h-100">
              <CCardBody>
                <h3 className="h5">{title}</h3>
                <p>{description}</p>
                <Link to={to}>Mở quản lý →</Link>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>
    </>
  )
}
