import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  MdDashboard, MdArticle, MdCategory, MdPeople,
  MdSettings, MdLogout, MdSportsSoccer, MdNewspaper, MdMenuBook, MdWebAsset, MdHome, MdClose,
} from 'react-icons/md'

const navItems = [
  { to: '/dashboard', icon: <MdDashboard size={20} />, label: 'Dashboard' },
  { to: '/home', icon: <MdHome size={20} />, label: 'Home Page' },
  { to: '/articles', icon: <MdArticle size={20} />, label: 'Articles' },
  { to: '/categories', icon: <MdCategory size={20} />, label: 'Categories' },
  { to: '/navigation', icon: <MdMenuBook size={20} />, label: 'Navigation' },
  { to: '/pages', icon: <MdWebAsset size={20} />, label: 'Pages' },
  { to: '/team', icon: <MdPeople size={20} />, label: 'Team', adminOnly: true },
  { to: '/settings', icon: <MdSettings size={20} />, label: 'Settings' },
]

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout, activeSite, switchSite } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const isSports = activeSite === 'sports'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 w-64 h-[100dvh] lg:h-screen bg-gray-950 flex flex-col border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800 flex items-start justify-between shrink-0">
          <div>
            <div className="text-white font-black text-xl tracking-tight flex items-center gap-2">
              {isSports ? <MdSportsSoccer size={20} className="text-yellow-400" /> : <MdNewspaper size={20} />}
              {isSports ? 'TEN SPORTS' : 'TAVE NEWS'}
            </div>
            <div className="text-gray-500 text-xs mt-1">Admin CMS</div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Site Switcher */}
        <div className="p-4 border-b border-gray-800 shrink-0">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Switch site</div>
          <div className="flex gap-2">
            <button
              onClick={() => switchSite('sports')}
              className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center gap-1 justify-center transition-all ${
                isSports ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <MdSportsSoccer size={14} /> Sports
            </button>
            <button
              onClick={() => switchSite('news')}
              className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center gap-1 justify-center transition-all ${
                !isSports ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <MdNewspaper size={14} /> News
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-1">
          {navItems.map(item => {
            if (item.adminOnly && user?.role !== 'admin') return null
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? (isSports ? 'bg-yellow-400 text-black' : 'bg-white text-black')
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-800 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white text-sm font-medium">{user?.name}</div>
              <div className="text-gray-500 text-xs capitalize">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 text-sm transition-all"
          >
            <MdLogout size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}