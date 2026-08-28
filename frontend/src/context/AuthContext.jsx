import { createContext, useEffect, useState, useCallback } from "react"
import { api } from "../api/client"

export const AuthContext = createContext(null)

const TOKEN_STORAGE_KEY = "vitalens_token"

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState(null)
  // Whether we're still trying to resolve the current session on load
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      if (!token) {
        setInitializing(false)
        return
      }

      try {
        const me = await api.me(token)
        if (!cancelled) setUser(me)
      } catch {
        // Token invalid/expired — clear it
        if (!cancelled) {
          setToken(null)
          setUser(null)
          localStorage.removeItem(TOKEN_STORAGE_KEY)
        }
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    loadUser()
    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password)
    localStorage.setItem(TOKEN_STORAGE_KEY, result.access_token)
    setToken(result.access_token)
    const me = await api.me(result.access_token)
    setUser(me)
    return me
  }, [])

  const register = useCallback(async (name, email, password) => {
    await api.register(name, email, password)
    // Registration doesn't log the user in automatically on the backend,
    // so follow up with a login to get a token.
    return login(email, password)
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    initializing,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
