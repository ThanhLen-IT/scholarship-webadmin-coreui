const KEY = 'scholarship_admin_token'
export const tokenStorage = {
  get: () => sessionStorage.getItem(KEY),
  set: (token) => sessionStorage.setItem(KEY, token),
  clear: () => sessionStorage.removeItem(KEY),
}
export async function api(path, { body, binary = false, ...options } = {}) {
  const headers = new Headers(options.headers)
  const token = tokenStorage.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  let response
  try {
    response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}${path}`, {
      ...options,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Không kết nối được backend. Kiểm tra máy chủ và cấu hình proxy.')
  }
  if (response.ok && binary) return response.blob()
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.success === false) {
    if (response.status === 401 || response.status === 403) {
      window.dispatchEvent(new Event('admin-session-invalid'))
    }
    throw new Error(result?.message || `Yêu cầu thất bại (${response.status})`)
  }
  if (!result) throw new Error('Backend trả về dữ liệu không hợp lệ.')
  return result
}
export function query(values) {
  return new URLSearchParams(
    Object.entries(values).filter(([, v]) => v !== '' && v != null),
  ).toString()
}
