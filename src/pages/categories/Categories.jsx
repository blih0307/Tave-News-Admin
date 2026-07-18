import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAPI } from '../../utils/api'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdDelete, MdCheck, MdClose } from 'react-icons/md'

export default function Categories() {
  const { activeSite } = useAuth()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', description: '', parent: '' })
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    const res = await getAPI(activeSite).get('/categories')
    setCategories(res.data.data || [])
  }

  useEffect(() => { fetchCategories() }, [activeSite])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const api = getAPI(activeSite)
      if (editing) {
        await api.put(`/categories/${editing}`, form)
        toast.success('Category updated')
        setEditing(null)
      } else {
        await api.post('/categories', form)
        toast.success('Category created')
      }
      setForm({ name: '', description: '', parent: '' })
      fetchCategories()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const handleEdit = (cat) => {
    setEditing(cat._id)
    setForm({ name: cat.name, description: cat.description || '', parent: cat.parent || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try {
      await getAPI(activeSite).delete(`/categories/${id}`)
      toast.success('Category deleted')
      fetchCategories()
    } catch (e) { toast.error('Failed to delete') }
  }

  // Sports categories preset
  const sportsPresets = ['Football', 'Basketball', 'Tennis', 'Athletics', 'Transfer News', 'Match Previews', 'Analysis', 'Opinion']
  const newsPresets = ['Nigeria', 'Africa', 'World', 'Entertainment', 'Tech', 'Business', 'Lifestyle', 'Opinion']
  const presets = activeSite === 'sports' ? sportsPresets : newsPresets

  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-6">Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">{editing ? 'Edit Category' : 'Add Category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Category name"
                required
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
              />
            </div>
            <div>
  <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Section</label>
  <input
    value={form.parent}
    onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}
    placeholder="Type an existing section or a brand new one..."
    list="section-options"
    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
  />
  <datalist id="section-options">
    {[...new Set(categories.map(cat => cat.parent).filter(Boolean))].map(section => (
      <option key={section} value={section} />
    ))}
  </datalist>
  <p className="text-gray-600 text-xs mt-1">Leave blank for a top-level category, or type a new section name to group it under</p>
</div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1 justify-center">
                {editing ? <><MdCheck size={16} /> Update</> : <><MdAdd size={16} /> Add Category</>}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm({ name: '', description: '', parent: '' }) }}>
                  <MdClose size={16} />
                </Button>
              )}
            </div>
          </form>

          {/* Quick presets */}
          <div className="mt-5 border-t border-gray-700 pt-4">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Quick add presets</p>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, name: p }))}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-white font-semibold">All Categories ({categories.length})</h2>
          </div>
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No categories yet</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {categories.map(cat => (
                <div key={cat._id} className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-gray-750">
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{cat.name}</div>
                    {cat.parent && <div className="text-gray-500 text-xs truncate">Under: {cat.parent}</div>}
                    <div className="text-gray-600 text-xs font-mono truncate">/{cat.slug}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}><MdEdit size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cat._id)} className="hover:text-red-400"><MdDelete size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
