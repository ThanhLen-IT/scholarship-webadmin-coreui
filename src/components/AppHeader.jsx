import { useDispatch, useSelector } from 'react-redux'
import { CButton, CContainer, CHeader, CHeaderToggler, useColorModes } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu } from '@coreui/icons'
import { useAuth } from '../auth/AuthContext'
export default function AppHeader() {
  const dispatch = useDispatch()
  const visible = useSelector((state) => state.sidebarShow)
  const { user, logout } = useAuth()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  return (
    <CHeader position="sticky" className="mb-4">
      <CContainer fluid className="px-4 gap-2">
        <CHeaderToggler
          aria-label="Ẩn hoặc hiện menu"
          onClick={() => dispatch({ type: 'set', sidebarShow: !visible })}
        >
          <CIcon icon={cilMenu} />
        </CHeaderToggler>
        <span className="ms-auto">{user.full_name}</span>
        <CButton
          size="sm"
          color="secondary"
          variant="outline"
          onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
        >
          Sáng / tối
        </CButton>
        <CButton size="sm" color="danger" variant="outline" onClick={logout}>
          Đăng xuất
        </CButton>
      </CContainer>
    </CHeader>
  )
}
