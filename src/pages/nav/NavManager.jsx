import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAPI } from '../../utils/api'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import {
  MdAdd, MdEdit, MdDelete, MdClose, MdCheck, MdArrowUpward, MdArrowDownward,
  MdVisibility, MdVisibilityOff, MdDragIndicator,
} from 'react-icons/md'

const emptyItem = () => ({ label: '', to: '', subnav: [] })

function NavItemEditor({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item)

  const updateSub = (i, patch) => {
    setForm(f => ({ ...f, subnav: f.subnav.map((s, idx) => idx === i ? { ...s, ...patch } : s) }))
  }
  const addSub = () => setForm(f => ({ ...f, subnav: [...f.subnav, { label: '', to: '', order: f.subnav.length }] }))
  const removeSub = (i) => setForm(f => ({ ...f, subnav: f.subnav.filter((_, idx) => idx !== i) }))
  const moveSub = (i, dir) => {
    setForm(f => {
      const arr = [...f.subnav]
      const j = i + dir
      if (j < 0 || j >= arr.length) return f
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...f, subnav: arr.map((s, idx) => ({ ...s, order: idx })) }
    })
  }

  return (
    <div className="bg-gray-800 border border-yellow-400/40 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Label</label>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Business"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Link (URL path)</label>
          <input
            value={form.to}
            onChange={e => setForm(f => ({ ...f, to: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            placeholder="e.g. /business"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400 font-mono"
          />
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Dropdown links (optional)</label>
        <div className="space-y-2">
          {form.subnav.map((s, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2 flex-wrap">
              <div className="flex flex-col">
                <button type="button" onClick={() => moveSub(i, -1)} disabled={i === 0} className="text-gray-500 hover:text-white disabled:opacity-30">
                  <MdArrowUpward size={12} />
                </button>
                <button type="button" onClick={() => moveSub(i, 1)} disabled={i === form.subnav.length - 1} className="text-gray-500 hover:text-white disabled:opacity-30">
                  <MdArrowDownward size={12} />
                </button>
              </div>
              <input
                value={s.label}
                onChange={e => updateSub(i, { label: e.target.value })}
                placeholder="Link label"
                className="flex-1 min-w-[120px] bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400"
              />
              <input
                value={s.to}
                onChange={e => updateSub(i, { to: e.target.value })}
                placeholder="/path"
                className="flex-1 min-w-[120px] bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 font-mono"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeSub(i)} className="hover:text-red-400 shrink-0">
                <MdDelete size={14} />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addSub} className="mt-2">
          <MdAdd size={14} /> Add dropdown link
        </Button>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-700">
        <Button onClick={() => onSave(form)} disabled={!form.label || !form.to} className="flex-1 justify-center">
          <MdCheck size={16} /> Save
        </Button>
        <Button variant="secondary" onClick={onCancel}><MdClose size={16} /></Button>
      </div>
    </div>
  )
}

export default function NavManager() {
  const { activeSite } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null) // '_id' being edited, or 'new'
  const [savingOrder, setSavingOrder] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await getAPI(activeSite).get('/nav-items/admin/all')
      setItems(res.data.data || [])
    } catch (e) { toast.error('Failed to load nav items') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [activeSite])

  const handleSave = async (form) => {
    try {
      const api = getAPI(activeSite)
      if (editingId === 'new') {
        await api.post('/nav-items', form)
        toast.success('Nav link added')
      } else {
        await api.put(`/nav-items/${editingId}`, form)
        toast.success('Nav item updated')
      }
      setEditingId(null)
      fetchItems()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this link from the navigation?')) return
    try {
      await getAPI(activeSite).delete(`/nav-items/${id}`)
      toast.success('Removed from nav')
      fetchItems()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete') }
  }

  const toggleActive = async (item) => {
    try {
      await getAPI(activeSite).put(`/nav-items/${item._id}`, { isActive: !item.isActive })
      fetchItems()
    } catch (e) { toast.error('Failed to update') }
  }

  const moveItem = async (index, dir) => {
    const j = index + dir
    if (j < 0 || j >= items.length) return
    const reordered = [...items]
    ;[reordered[index], reordered[j]] = [reordered[j], reordered[index]]
    setItems(reordered)
    setSavingOrder(true)
    try {
      await getAPI(activeSite).put('/nav-items/reorder', { order: reordered.map(i => i._id) })
    } catch (e) { toast.error('Failed to save order'); fetchItems() }
    finally { setSavingOrder(false) }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">Navigation</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the header links shown on the live site. Reorder, rename, hide, or add new ones.</p>
        </div>
        <Button onClick={() => setEditingId('new')}><MdAdd size={16} /> Add Link</Button>
      </div>

      {editingId === 'new' && (
        <div className="mb-4">
          <NavItemEditor item={emptyItem()} onSave={handleSave} onCancel={() => setEditingId(null)} />
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            editingId === item._id ? (
              <NavItemEditor key={item._id} item={item} onSave={handleSave} onCancel={() => setEditingId(null)} />
            ) : (
              <div key={item._id} className={`bg-gray-800 rounded-xl p-4 ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col shrink-0">
                      <button onClick={() => moveItem(i, -1)} disabled={i === 0 || savingOrder} className="text-gray-500 hover:text-white disabled:opacity-30">
                        <MdArrowUpward size={14} />
                      </button>
                      <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1 || savingOrder} className="text-gray-500 hover:text-white disabled:opacity-30">
                        <MdArrowDownward size={14} />
                      </button>
                    </div>
                    <MdDragIndicator className="text-gray-600 shrink-0" size={18} />
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{item.label}</div>
                      <div className="text-gray-500 text-xs font-mono truncate">{item.to}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(item)} title={item.isActive ? 'Hide from live nav' : 'Show in live nav'}>
                      {item.isActive ? <MdVisibility size={16} /> : <MdVisibilityOff size={16} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(item._id)}><MdEdit size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item._id)} className="hover:text-red-400"><MdDelete size={14} /></Button>
                  </div>
                </div>
                {item.subnav?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pl-8">
                    {[...item.subnav].sort((a, b) => a.order - b.order).map((s, idx) => (
                      <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full">{s.label}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          ))}
          {items.length === 0 && (
            <div className="p-8 text-center text-gray-500 bg-gray-800 rounded-xl">No nav links yet — click "Add Link" to create the first one.</div>
          )}
        </div>
      )}
    </div>
  )
}
