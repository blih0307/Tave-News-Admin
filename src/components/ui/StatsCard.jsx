export default function StatsCard({ label, value, icon, color = 'yellow' }) {
  const colors = {
    yellow: 'bg-yellow-400 text-black',
    white: 'bg-white text-black',
    gray: 'bg-gray-700 text-white',
  }
  return (
    <div className="bg-gray-800 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-gray-400 text-xs uppercase tracking-widest">{label}</div>
        <div className="text-white text-2xl font-bold">{value}</div>
      </div>
    </div>
  )
}
