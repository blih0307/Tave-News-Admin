import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ArticleList from './pages/articles/ArticleList'
import ArticleEditor from './pages/articles/ArticleEditor'
import Categories from './pages/categories/Categories'
import NavManager from './pages/nav/NavManager'
import PagesList from './pages/pages/PagesList'
import PageSectionEditor from './pages/pages/PageSectionEditor'
import HomeManager from './pages/home/HomeManager'
import Team from './pages/team/Team'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-yellow-400 text-sm animate-pulse">Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/home" element={<ProtectedRoute><HomeManager /></ProtectedRoute>} />
      <Route path="/articles" element={<ProtectedRoute><ArticleList /></ProtectedRoute>} />
      <Route path="/articles/new" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
      <Route path="/articles/edit/:id" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
      <Route path="/navigation" element={<ProtectedRoute><NavManager /></ProtectedRoute>} />
      <Route path="/pages" element={<ProtectedRoute><PagesList /></ProtectedRoute>} />
      <Route path="/pages/:page" element={<ProtectedRoute><PageSectionEditor /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' },
            success: { iconTheme: { primary: '#FFD600', secondary: '#000' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
