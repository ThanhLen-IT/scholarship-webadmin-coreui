import { lazy } from 'react'
export const routes = [
  { path: '/dashboard', name: 'Tổng quan', element: lazy(() => import('./views/admin/Overview')) },
  {
    path: '/monitoring',
    name: 'Giám sát hệ thống',
    element: lazy(() => import('./views/admin/Monitoring')),
  },
  {
    path: '/scholarships',
    name: 'Quản lý học bổng',
    element: lazy(() => import('./views/admin/Scholarships')),
  },
  { path: '/crawler', name: 'Crawler', element: lazy(() => import('./views/admin/Crawler')) },
  {
    path: '/mentor-verifications',
    name: 'Xác minh mentor',
    element: lazy(() => import('./views/admin/Mentors')),
  },
  {
    path: '/review-audit',
    name: 'Nhật ký xét duyệt',
    element: lazy(() => import('./views/admin/ReviewAudit')),
  },
]
