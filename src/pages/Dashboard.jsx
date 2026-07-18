import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAPI, formatDate } from '../utils/api'
import StatsCard from '../components/ui/StatsCard'
import Badge from '../components/ui/Badge'
import { MdArticle, MdCategory, MdPeople, MdVisibility } from 'react-icons/md'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, activeSite } = useAuth()
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, categories: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = getAPI(activeSite)
        const [articlesRes, catRes] = await Promise.all([
          api.get('/articles/admin/all?limit=5'),
          api.get('/categories'),
        ])
        const articles = articlesRes.data
        setRecent(articles.data || [])
        const all = articles.total || 0
        const pub = (articles.data || []).filter(a => a.status === 'published').length
        setStats({
          total: all,
          published: pub,
          draft: all - pub,
          categories: catRes.data.count || 0,
        })
      } catch (e) {
        console.error(e)
      } finally { setLoading(false) }
    }
    fetchData()
  }, [activeSite])

  const site = activeSite === 'sports' ? 'Tave News' : 'Tave News'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Managing <span className="text-yellow-400 font-semibold">{site}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Articles" value={stats.total} icon={<MdArticle />} color="yellow" />
        <StatsCard label="Published" value={stats.published} icon={<MdVisibility />} color="white" />
        <StatsCard label="Drafts" value={stats.draft} icon={<MdArticle />} color="gray" />
        <StatsCard label="Categories" value={stats.categories} icon={<MdCategory />} color="gray" />
      </div>

      {/* Recent Articles */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold">Recent Articles</h2>
          <Link to="/articles" className="text-yellow-400 text-sm hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No articles yet. <Link to="/articles/new" className="text-yellow-400 hover:underline">Create your first one</Link></div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-gray-900">
              <tr>
                {['Title', 'Category', 'Author', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-widest px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(article => (
                <tr key={article._id} className="border-t border-gray-700 hover:bg-gray-750 transition-colors">
                  <td className="px-5 py-4">
                    <Link to={`/articles/edit/${article._id}`} className="text-white text-sm font-medium hover:text-yellow-400 transition-colors line-clamp-1">
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-sm">{article.category?.name || '—'}</td>
                  <td className="px-5 py-4 text-gray-400 text-sm">{article.author?.name || '—'}</td>
                  <td className="px-5 py-4"><Badge status={article.status} /></td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(article.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
