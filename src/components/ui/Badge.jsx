export default function Badge({ status }) {
  const styles = {
    published: 'bg-green-500/20 text-green-400',
    draft: 'bg-yellow-500/20 text-yellow-400',
    archived: 'bg-gray-500/20 text-gray-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}
