import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAPI } from '../../utils/api'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import { MdArrowBack, MdSave, MdImage, MdAdd, MdDelete } from 'react-icons/md'

const PAGE_NAMES = {
  home: 'Home',
  about: 'About',
  contact: 'Contact',
  monetization: 'Monetization',
  privacy: 'Privacy Policy',
  terms: 'Terms of Use',
}

const TYPE_OPTIONS = ['text', 'richtext', 'image', 'link', 'boolean', 'json']

function SectionField({ section, onChange, onUpload, uploadingKey }) {
  const { sectionKey, label, type, content } = section
  const isUploading = uploadingKey === sectionKey

  if (type === 'boolean') {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!content}
          onChange={e => onChange(sectionKey, e.target.checked)}
          className="w-4 h-4 accent-yellow-400"
        />
        <span className="text-white text-sm">{label}</span>
      </label>
    )
  }

  if (type === 'richtext') {
    return (
      <div>
        <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">{label}</label>
        <textarea
          value={content || ''}
          onChange={e => onChange(sectionKey, e.target.value)}
          rows={5}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400 resize-y"
        />
      </div>
    )
  }

  if (type === 'image' || type === 'logo') {
    const value = content && typeof content === 'object' ? content : { url: '', alt: '' }
    return (
      <div>
        <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">{label}</label>
        {value.url && <img src={value.url} alt={value.alt || ''} className="w-full max-w-xs h-32 object-cover rounded-lg mb-2 border border-gray-700" />}
        <label className="flex items-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2.5 text-sm transition-all w-fit mb-2">
          <MdImage size={16} />
          {isUploading ? 'Uploading...' : 'Upload Image'}
          <input type="file" accept="image/*" className="hidden" disabled={isUploading}
            onChange={e => e.target.files[0] && onUpload(sectionKey, e.target.files[0])} />
        </label>
        <input
          value={value.alt || ''}
          onChange={e => onChange(sectionKey, { ...value, alt: e.target.value })}
          placeholder="Alt text"
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-xs outline-none focus:border-yellow-400"
        />
      </div>
    )
  }

  if (type === 'json') {
    return (
      <div>
        <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">{label} <span className="normal-case text-gray-600">(raw JSON)</span></label>
        <textarea
          value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
          onChange={e => onChange(sectionKey, e.target.value, true)}
          rows={5}
          className="w-full bg-gray-950 text-green-400 font-mono border border-gray-600 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-yellow-400 resize-y"
        />
      </div>
    )
  }

  // text / link default
  return (
    <div>
      <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">{label}</label>
      <input
        value={content || ''}
        onChange={e => onChange(sectionKey, e.target.value)}
        className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400"
      />
    </div>
  )
}

export default function PageSectionEditor() {
  const { page } = useParams()
  const { activeSite } = useAuth()
  const navigate = useNavigate()

  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newField, setNewField] = useState({ sectionKey: '', label: '', group: 'General', type: 'text' })

  const fetchSections = async () => {
    setLoading(true)
    try {
      const res = await getAPI(activeSite).get(`/page-sections/admin/${page}`)
      setSections(res.data.data || [])
    } catch (e) {
      toast.error('Failed to load page content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSections() }, [activeSite, page])

  const updateContent = (sectionKey, value, isJsonRaw = false) => {
    setSections(prev => prev.map(s => {
      if (s.sectionKey !== sectionKey) return s
      if (isJsonRaw) {
        try { return { ...s, content: JSON.parse(value) } }
        catch { return { ...s, content: value } } // keep raw text while invalid, parsed again on next valid edit
      }
      return { ...s, content: value }
    }))
  }

  const handleUpload = async (sectionKey, file) => {
    setUploadingKey(sectionKey)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await getAPI(activeSite).post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateContent(sectionKey, { url: res.data.data.url, alt: '' })
      toast.success('Image uploaded')
    } catch (e) {
      toast.error('Upload failed')
    } finally {
      setUploadingKey(null)
    }
  }

  const handleAddField = () => {
    if (!newField.sectionKey || !newField.label) {
      toast.error('Field key and label are required')
      return
    }
    if (sections.some(s => s.sectionKey === newField.sectionKey)) {
      toast.error('A field with that key already exists')
      return
    }
    setSections(prev => [...prev, { ...newField, content: newField.type === 'boolean' ? false : newField.type === 'image' || newField.type === 'logo' ? { url: '', alt: '' } : '', order: prev.length }])
    setNewField({ sectionKey: '', label: '', group: 'General', type: 'text' })
    setShowAdd(false)
  }

  const handleRemoveField = (sectionKey) => {
    if (!confirm('Remove this field? This takes effect once you hit Save.')) return
    setSections(prev => prev.filter(s => s.sectionKey !== sectionKey))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = sections.map(({ sectionKey, label, group, type, content, order }) => ({ sectionKey, label, group, type, content, order }))
      await getAPI(activeSite).post(`/page-sections/${page}/bulk`, { sections: payload })
      toast.success('Page content saved')
      fetchSections()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const grouped = sections.reduce((acc, s) => {
    const g = s.group || 'General'
    acc[g] = acc[g] || []
    acc[g].push(s)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/pages"><Button variant="ghost" size="sm"><MdArrowBack size={16} /> Back</Button></Link>
          <h1 className="text-white text-xl font-bold">{PAGE_NAMES[page] || page} — Content</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAdd(v => !v)}><MdAdd size={16} /> Add Field</Button>
          <Button onClick={handleSave} disabled={saving}><MdSave size={16} /> {saving ? 'Saving...' : 'Save All'}</Button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-gray-800 border border-yellow-400/30 rounded-xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-1">Field Key</label>
            <input value={newField.sectionKey} onChange={e => setNewField(f => ({ ...f, sectionKey: e.target.value.replace(/\s+/g, '_') }))}
              placeholder="e.g. footer_note" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-1">Label</label>
            <input value={newField.label} onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Footer Note" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-1">Group</label>
            <input value={newField.group} onChange={e => setNewField(f => ({ ...f, group: e.target.value }))}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-1">Type</label>
            <select value={newField.type} onChange={e => setNewField(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400">
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Button onClick={handleAddField}>Add</Button>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : sections.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
          No content fields yet for this page. Click "Add Field" to create the first one, or run the <code className="text-gray-400">seedPageSections.js</code> script on the backend to load the starter set.
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([group, fields]) => (
            <div key={group} className="bg-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold border-b border-gray-700 pb-3 mb-4">{group}</h3>
              <div className="space-y-5">
                {fields.map(section => (
                  <div key={section.sectionKey} className="flex items-start gap-3">
                    <div className="flex-1">
                      <SectionField section={section} onChange={updateContent} onUpload={handleUpload} uploadingKey={uploadingKey} />
                    </div>
                    <button
                      onClick={() => handleRemoveField(section.sectionKey)}
                      className="mt-6 text-gray-600 hover:text-red-400 transition-all"
                      title="Remove field"
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
