import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CContainer,
  CForm,
  CFormInput,
  CSpinner,
} from '@coreui/react'
import { useAuth } from '../../../auth/AuthContext'
export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const destination = location.state?.from || '/dashboard'
  if (user) return <Navigate to={destination} replace />
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(identifier, password)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex align-items-center">
      <CContainer>
        <CCard className="mx-auto" style={{ maxWidth: 460 }}>
          <CCardBody className="p-4 p-md-5">
            <h1>Đăng nhập admin</h1>
            <p className="text-body-secondary">Scholarship Gateway</p>
            <CForm onSubmit={submit}>
              {error && (
                <CAlert color="danger" role="alert">
                  {error}
                </CAlert>
              )}
              <CFormInput
                className="mb-3"
                id="login-identifier"
                label="Email hoặc username"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <CFormInput
                className="mb-4"
                id="login-password"
                label="Mật khẩu"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <CButton type="submit" color="primary" className="w-100" disabled={busy}>
                {busy ? <CSpinner size="sm" /> : 'Đăng nhập'}
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CContainer>
    </div>
  )
}
