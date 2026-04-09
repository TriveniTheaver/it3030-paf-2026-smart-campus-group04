import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    // Axios v1 uses AxiosHeaders; support both plain objects and AxiosHeaders API.
    if (!config.headers) config.headers = {}
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`)
    } else {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
