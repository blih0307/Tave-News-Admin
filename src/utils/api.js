import axios from 'axios'

export const getAPI = (activeSite) => {
  const base = activeSite === 'sports'
    ? import.meta.env.VITE_SPORTS_API_URL
    : import.meta.env.VITE_NEWS_API_URL
  return axios.create({
    baseURL: base,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
}

export const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric'
})

export const truncate = (str, n) => str?.length > n ? str.slice(0, n) + '...' : str
