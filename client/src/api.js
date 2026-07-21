const BASE = 'http://localhost:3000'

// One wrapper around fetch so every request:
//  - sends the httpOnly auth cookie (credentials: 'include' is required per-request)
//  - hits the API base URL
//  - parses JSON and throws a useful error on non-2xx responses
export async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  // 204 No Content and empty bodies won't have JSON
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  return data
}

export const apiGet = (path) => api(path)
export const apiPost = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPut = (path, body) => api(path, { method: 'PUT', body: JSON.stringify(body) })
