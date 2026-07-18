import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user, activeSite } = useAuth()
  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold border-b border-gray-700 pb-3">Account</h2>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Name</label>
            <input defaultValue={user?.name} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Email</label>
            <input defaultValue={user?.email} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">New Password</label>
            <input type="password" placeholder="Leave blank to keep current" className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-400" />
          </div>
          <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-all">Save Changes</button>
        </div>

        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold border-b border-gray-700 pb-3 mb-4">Active Site</h2>
          <div className={`p-4 rounded-lg border-2 ${activeSite === 'sports' ? 'border-yellow-400 bg-yellow-400/10' : 'border-white bg-white/10'}`}>
            <div className="text-white font-bold text-lg">{activeSite === 'sports' ? '⚡ Tave News' : '📰 Tave News'}</div>
            <div className="text-gray-400 text-sm mt-1">Currently managing this site</div>
          </div>
          <p className="text-gray-500 text-xs mt-4">Switch sites using the sidebar toggle.</p>
        </div>
      </div>
    </div>
  )
}
