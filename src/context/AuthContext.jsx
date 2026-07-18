import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSite, setActiveSite] = useState(localStorage.getItem('activeSite') || 'sports')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = async (email, password, site) => {
    const base = site === 'sports' ? import.meta.env.VITE_SPORTS_API_URL : import.meta.env.VITE_NEWS_API_URL
    const res = await axios.post(`${base}/auth/login`, { email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('activeSite', site)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    setActiveSite(site)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const switchSite = (site) => {
    setActiveSite(site)
    localStorage.setItem('activeSite', site)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, activeSite, switchSite }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
