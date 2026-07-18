import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAPI, formatDate, truncate } from '../../utils/api'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import {
  MdAdd, MdEdit, MdDelete, MdClose, MdSearch, MdStar, MdSwapHoriz, MdOutlineImageNotSupported,
} from 'react-icons/md'

// ── Picker modal: search/select an article to assign to a home slot ────────
function ArticlePicker({ activeSite, onPick, onClose }) {
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await getAPI(activeSite).get('/articles/admin/all?status=published&limit=50')
        setArticles(res.data.data || [])
      } catch (e) { toast.error('Failed to load articles') }
      finally { setLoading(false) }
    })()
  }, [activeSite])

  const filtered = search
    ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    : articles

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl w-full max-w-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Choose an article</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><MdClose size={16} /></Button>
        </div>
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search published articles..."
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-yellow-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-700">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No published articles found</div>
          ) : filtered.map(a => (
            <button
              key={a._id}
              onClick={() => onPick(a)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-750"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                {a.featuredImage?.url
                  ? <img src={a.featuredImage.url} alt="" className="w-full h-full object-cover" />
                  : <MdOutlineImageNotSupported className="text-gray-600" size={18} />}
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-medium line-clamp-1">{a.title}</div>
                <div className="text-gray-500 text-xs">{formatDate(a.publishedAt || a.createdAt)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── A slot card: hero or one side-news slot ─────────────────────────────
function SlotCard({ label, article, onAssign, onRemove }) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-700 flex items-center justify-between">
        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</span>
        {article && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="hover:text-red-400" title="Remove from this slot">
            <MdClose size={14} />
          </Button>
        )}
      </div>
      {article ? (
        <div className="p-4 flex gap-3">
          <div className="w-16 h-16 rounded-lg bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
            {article.featuredImage?.url
              ? <img src={article.featuredImage.url} alt="" className="w-full h-full object-cover" />
              : <MdOutlineImageNotSupported className="text-gray-600" size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm font-semibold line-clamp-2">{article.title}</div>
            <div className="text-gray-500 text-xs mt-1">{formatDate(article.publishedAt || article.createdAt)}</div>
            <div className="flex gap-2 mt-2">
              <Link to={`/articles/edit/${article._id}`}>
                <Button variant="secondary" size="sm"><MdEdit size={12} /> Edit</Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={onAssign}><MdSwapHoriz size={12} /> Change</Button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={onAssign} className="w-full p-6 text-center text-gray-500 hover:text-yellow-400 hover:bg-gray-750 transition-all text-sm">
          <MdAdd size={18} className="mx-auto mb-1" /> Empty — assign an article
        </button>
      )}
    </div>
  )
}

export default function HomeManager() {
  const { activeSite } = useAuth()
  const [layout, setLayout] = useState({ hero: null, sideNews: [null, null, null, null], latestNews: [], latestNewsPagination: {} })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [picker, setPicker] = useState(null) // { position: 'hero'|'side', slot? }

  const fetchLayout = async () => {
    setLoading(true)
    try {
      const res = await getAPI(activeSite).get(`/articles/admin/home-layout?page=${page}&limit=15`)
      setLayout(res.data.data)
    } catch (e) { toast.error('Failed to load home layout') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLayout() }, [activeSite, page])

  const assign = async (articleId, position, slot) => {
    try {
      await getAPI(activeSite).put(`/articles/${articleId}/home-position`, { position, slot })
      toast.success('Home page updated')
      setPicker(null)
      fetchLayout()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update') }
  }

  const remove = async (articleId) => {
    try {
      await getAPI(activeSite).put(`/articles/${articleId}/home-position`, { position: 'none' })
      toast.success('Removed from home page')
      fetchLayout()
    } catch (e) { toast.error('Failed to update') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return
    try {
      await getAPI(activeSite).delete(`/articles/${id}`)
      toast.success('Article deleted')
      fetchLayout()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">Home Page</h1>
          <p className="text-gray-500 text-sm mt-1">Control which articles appear as the hero, side news, and latest news on the homepage.</p>
        </div>
        <Link to="/articles/new">
          <Button><MdAdd size={16} /> Create News</Button>
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Hero */}
          <div className="mb-4">
            <SlotCard
              label="Hero — main homepage story"
              article={layout.hero}
              onAssign={() => setPicker({ position: 'hero' })}
              onRemove={() => remove(layout.hero._id)}
            />
          </div>

          {/* Side news slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {layout.sideNews.map((article, i) => (
              <SlotCard
                key={i}
                label={`Side news — slot ${i + 1}`}
                article={article}
                onAssign={() => setPicker({ position: 'side', slot: i + 1 })}
                onRemove={() => remove(article._id)}
              />
            ))}
          </div>

          {/* Latest news */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-700">
              <h2 className="text-white font-semibold">Latest News</h2>
              <p className="text-gray-500 text-xs mt-0.5">Everything else, most recent first. Assign any of these to the hero or a side slot above.</p>
            </div>
            {layout.latestNews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No more published articles</div>
            ) : (
              <>
                <div className="divide-y divide-gray-700">
                  {layout.latestNews.map(a => (
                    <div key={a._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-750 flex-wrap">
                      <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {a.featuredImage?.url
                          ? <img src={a.featuredImage.url} alt="" className="w-full h-full object-cover" />
                          : <MdOutlineImageNotSupported className="text-gray-600" size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-sm font-medium line-clamp-1">{a.title}</div>
                        <div className="text-gray-500 text-xs line-clamp-1">{truncate(a.excerpt, 70)}</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 flex-wrap">
                        <Button variant="secondary" size="sm" onClick={() => assign(a._id, 'hero')}>
                          <MdStar size={12} /> Hero
                        </Button>
                        <select
                          defaultValue=""
                          onChange={e => e.target.value && assign(a._id, 'side', parseInt(e.target.value))}
                          className="bg-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 outline-none border border-gray-600"
                        >
                          <option value="" disabled>Side slot...</option>
                          <option value="1">Slot 1</option>
                          <option value="2">Slot 2</option>
                          <option value="3">Slot 3</option>
                          <option value="4">Slot 4</option>
                        </select>
                        <Link to={`/articles/edit/${a._id}`}>
                          <Button variant="ghost" size="sm"><MdEdit size={14} /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(a._id)} className="hover:text-red-400">
                          <MdDelete size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-4 border-t border-gray-700">
                  <span className="text-gray-500 text-sm">Page {layout.latestNewsPagination.currentPage} of {layout.latestNewsPagination.pages || 1}</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Button variant="secondary" size="sm" disabled={page >= (layout.latestNewsPagination.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {picker && (
        <ArticlePicker
          activeSite={activeSite}
          onPick={(article) => assign(article._id, picker.position, picker.slot)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}