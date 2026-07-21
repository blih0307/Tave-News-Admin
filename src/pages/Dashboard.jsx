import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAPI, formatDate } from '../utils/api'
import StatsCard from '../components/ui/StatsCard'
import Badge from '../components/ui/Badge'
import { MdArticle, MdCategory, MdVisibility, MdWhatshot } from 'react-icons/md'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, activeSite } = useAuth()
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, categories: 0 })
  const [recent, setRecent] = useState([])
  const [totalViews, setTotalViews] = useState(0)
  const [mostRead, setMostRead] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = getAPI(activeSite)
        const [articlesRes, catRes, statsRes] = await Promise.all([
          api.get('/articles/admin/all?limit=5'),
          api.get('/categories'),
          api.get('/articles/admin/stats'),
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
        setTotalViews(statsRes.data.data?.totalViews || 0)
        setMostRead(statsRes.data.data?.mostRead || [])
      } catch (e) {
        console.error(e)
      } finally { setLoading(false) }
    }
    fetchData()
  }, [activeSite])

  const site = activeSite === 'sports' ? 'Tave Sports' : 'Tave News'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Managing <span className="text-yellow-400 font-semibold">{site}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard label="Total Articles" value={stats.total} icon={<MdArticle />} color="yellow" />
        <StatsCard label="Published" value={stats.published} icon={<MdArticle />} color="white" />
        <StatsCard label="Drafts" value={stats.draft} icon={<MdArticle />} color="gray" />
        <StatsCard label="Categories" value={stats.categories} icon={<MdCategory />} color="gray" />
        <StatsCard label="Total Views" value={totalViews.toLocaleString()} icon={<MdVisibility />} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl overflow-hidden self-start">
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

        {/* Most Read */}
        <div className="bg-gray-800 rounded-xl overflow-hidden self-start">
          <div className="flex items-center gap-2 p-5 border-b border-gray-700">
            <MdWhatshot className="text-yellow-400" size={18} />
            <h2 className="text-white font-semibold">Most Read</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : mostRead.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No views recorded yet</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {mostRead.map((article, i) => (
                <Link
                  key={article._id}
                  to={`/articles/edit/${article._id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-750 transition-colors"
                >
                  <span className="text-gray-600 text-sm font-bold w-4">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-sm font-medium line-clamp-1">{article.title}</div>
                    <div className="text-gray-500 text-xs">{article.category?.name || '—'}</div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs shrink-0">
                    <MdVisibility size={13} />
                    {(article.views || 0).toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
