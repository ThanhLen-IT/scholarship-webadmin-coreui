import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { CAlert, CButton, CSpinner } from '@coreui/react'
import { api, tokenStorage } from '../services/api'
const Context = createContext(null)
export const useAuth = () => useContext(Context)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function restore() {
      try {
        if (tokenStorage.get()) {
          const result = await api('/auth/me', { signal: controller.signal })
          if (result.data?.role !== 'admin') throw new Error('Tài khoản không có quyền quản trị.')
          if (!controller.signal.aborted) setUser(result.data)
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    restore()
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    const invalidate = () => {
      tokenStorage.clear()
      setUser(null)
    }
    window.addEventListener('admin-session-invalid', invalidate)
    return () => window.removeEventListener('admin-session-invalid', invalidate)
  }, [])
  const value = {
    user,
    async login(identifier, password) {
      tokenStorage.clear()
      const result = await api('/auth/login', { method: 'POST', body: { identifier, password } })
      if (result.data?.user?.role !== 'admin') throw new Error('Tài khoản không có quyền quản trị.')
      tokenStorage.set(result.data.token)
      setError('')
      setUser(result.data.user)
    },
    logout() {
      tokenStorage.clear()
      setUser(null)
      setError('')
    },
  }
  if (loading)
    return (
      <div className="p-5 text-center">
        <CSpinner />
        <p>Đang kiểm tra phiên đăng nhập…</p>
      </div>
    )
  if (error && tokenStorage.get())
    return (
      <div className="container py-5">
        <CAlert color="danger">{error}</CAlert>
        <CButton
          onClick={() => {
            setError('')
            setLoading(true)
            setAttempt(attempt + 1)
          }}
        >
          Thử lại
        </CButton>
        <CButton className="ms-2" color="secondary" onClick={value.logout}>
          Đăng nhập lại
        </CButton>
      </div>
    )
  return <Context.Provider value={value}>{children}</Context.Provider>
}
AuthProvider.propTypes = { children: PropTypes.node }
export function RequireAdmin({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  return user ? (
    children
  ) : (
    <Navigate to="/authentication/login" state={{ from: location.pathname }} replace />
  )
}
RequireAdmin.propTypes = { children: PropTypes.node }
