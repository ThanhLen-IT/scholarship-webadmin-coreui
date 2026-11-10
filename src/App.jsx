import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import { AuthProvider, RequireAdmin } from './auth/AuthContext'
import './scss/style.scss'
const DefaultLayout = lazy(() => import('./layout/DefaultLayout'))
const Login = lazy(() => import('./views/authentication/login/Login'))
export default function App() {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const theme = useSelector((state) => state.theme)
  useEffect(() => {
    if (!isColorModeSet()) setColorMode(theme)
  }, [isColorModeSet, setColorMode, theme])
  return (
    <HashRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="p-5 text-center">
              <CSpinner />
            </div>
          }
        >
          <Routes>
            <Route path="/authentication/login" element={<Login />} />
            <Route path="/login" element={<Navigate to="/authentication/login" replace />} />
            <Route
              path="*"
              element={
                <RequireAdmin>
                  <DefaultLayout />
                </RequireAdmin>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </HashRouter>
  )
}
