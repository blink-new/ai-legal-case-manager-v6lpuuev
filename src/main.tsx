import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global error handler for analytics and other non-critical errors
window.addEventListener('error', (event) => {
  // Suppress analytics-related errors to prevent console spam
  if (event.error?.message?.includes('analytics') || 
      event.error?.name === 'BlinkNetworkError' ||
      event.message?.includes('Failed to send analytics')) {
    console.warn('Analytics error suppressed:', event.error?.message || event.message)
    event.preventDefault()
    return false
  }
})

// Handle unhandled promise rejections (like analytics failures)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('analytics') || 
      event.reason?.name === 'BlinkNetworkError' ||
      event.reason?.message?.includes('Failed to send analytics')) {
    console.warn('Analytics promise rejection suppressed:', event.reason?.message)
    event.preventDefault()
    return false
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 