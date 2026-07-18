import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAPI, formatDate, truncate } from '../../utils/api'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md'
import toast from 'react-hot-toast'

export default function ArticleList() {
  const { activeSite } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const api = getAPI(activeSite)
      const params = new URLSearchParams({ page, limit: 15 })
      if (filter !== 'all') params.append('status', filter)
      const res = await api.get(`/articles/admin/all?${params}`)
      setArticles(res.data.data || [])
      setTotalPages(res.data.pages || 1)
    } catch (e) { toast.error('Failed to load articles') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchArticles() }, [activeSite, filter, page])

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return
    try {
      await getAPI(activeSite).delete(`/articles/${id}`)
      toast.success('Article deleted')
      fetchArticles()
    } catch (e) { toast.error('Failed to delete') }
  }

  const filtered = search
    ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    : articles

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Articles</h1>
        <Link to="/articles/new">
          <Button><MdAdd size={16} /> New Article</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-yellow-400"
          />
        </div>
        {['all', 'published', 'draft', 'archived'].map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1) }}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === s ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No articles found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-900">
                <tr>
                  {['Title', 'Category', 'Status', 'Views', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-widest px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(article => (
                  <tr key={article._id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-5 py-4 max-w-xs">
                      <div className="text-white text-sm font-medium line-clamp-1">{article.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{truncate(article.excerpt, 60)}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-sm">{article.category?.name || '—'}</td>
                    <td className="px-5 py-4"><Badge status={article.status} /></td>
                    <td className="px-5 py-4 text-gray-400 text-sm">{article.views || 0}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(article.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Link to={`/articles/edit/${article._id}`}>
                          <Button variant="ghost" size="sm"><MdEdit size={14} /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(article._id)} className="hover:text-red-400">
                          <MdDelete size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-gray-700">
              <span className="text-gray-500 text-sm">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
