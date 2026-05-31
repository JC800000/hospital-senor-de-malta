import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

// sessionStorage = aislado por pestaña del navegador
// Permite tener distintos roles en distintas pestañas sin que se interfieran.
// También persiste en F5 (a diferencia de lo que se podría pensar).
const store = sessionStorage

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => store.getItem('token'))
  const [usuario, setUsuario] = useState(() => {
    const u = store.getItem('usuario')
    return u ? JSON.parse(u) : null
  })

  const login = useCallback((token, usuario) => {
    store.setItem('token', token)
    store.setItem('usuario', JSON.stringify(usuario))
    setToken(token)
    setUsuario(usuario)
  }, [])

  const logout = useCallback(() => {
    store.removeItem('token')
    store.removeItem('usuario')
    setToken(null)
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
