import { useState } from 'react'
import Sidebar from './Sidebar'
import { MdMenu } from 'react-icons/md'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-gray-950 border-b border-gray-800 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white"
            aria-label="Open sidebar"
          >
            <MdMenu size={24} />
          </button>
          <span className="text-white font-black text-lg tracking-tight">TAVE ADMIN</span>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
