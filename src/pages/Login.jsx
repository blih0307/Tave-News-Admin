import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', site: 'sports' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password, form.site)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-white font-black text-3xl tracking-tight mb-1">TEN MEDIA</div>
          <div className="text-gray-500 text-sm">Content Management System</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-5 border border-gray-800">
          {/* Site selector */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Select Site</label>
            <div className="flex gap-2">
              {['sports', 'news'].map(site => (
                <button
                  key={site}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, site }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                    form.site === site
                      ? site === 'sports' ? 'bg-yellow-400 text-black' : 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Ten {site.charAt(0).toUpperCase() + site.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-yellow-400 transition-colors"
              placeholder="admin@tavenews.com"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-yellow-400 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
              form.site === 'sports'
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-white text-black hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
