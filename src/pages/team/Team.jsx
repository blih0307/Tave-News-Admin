import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAPI, formatDate } from '../../utils/api'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdPersonOff } from 'react-icons/md'

export default function Team() {
  const { activeSite } = useAuth()
  const [team, setTeam] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'writer' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchTeam = async () => {
    try {
      const res = await getAPI(activeSite).get('/auth/team')
      setTeam(res.data.data || [])
    } catch (e) { toast.error('Failed to load team') }
  }

  useEffect(() => { fetchTeam() }, [activeSite])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await getAPI(activeSite).post('/auth/register', form)
      toast.success('Team member added')
      setForm({ name: '', email: '', password: '', role: 'writer' })
      setShowForm(false)
      fetchTeam()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return
    try {
      await getAPI(activeSite).delete(`/auth/team/${id}`)
      toast.success('User deactivated')
      fetchTeam()
    } catch (e) { toast.error('Failed') }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await getAPI(activeSite).put(`/auth/team/${id}`, { role })
      toast.success('Role updated')
      fetchTeam()
    } catch (e) { toast.error('Failed') }
  }

  const roleColors = { admin: 'bg-yellow-400/20 text-yellow-400', editor: 'bg-blue-400/20 text-blue-400', writer: 'bg-green-400/20 text-green-400' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Team</h1>
        <Button onClick={() => setShowForm(!showForm)}><MdAdd size={16} /> Add Member</Button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-4">New Team Member</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'john@tavenews.com' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
                />
              </div>
            ))}
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
              >
                <option value="writer">Writer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Member'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-900">
            <tr>
              {['Member', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-widest px-3 sm:px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.map(member => (
              <tr key={member._id} className="border-t border-gray-700">
                <td className="px-3 sm:px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{member.name}</div>
                      <div className="text-gray-500 text-xs">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-5 py-4">
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member._id, e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-yellow-400"
                  >
                    <option value="writer">Writer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-3 sm:px-5 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${member.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 sm:px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDate(member.createdAt)}</td>
                <td className="px-3 sm:px-5 py-4">
                  <Button variant="ghost" size="sm" onClick={() => handleDeactivate(member._id)} className="hover:text-red-400">
                    <MdPersonOff size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
