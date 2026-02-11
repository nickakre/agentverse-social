import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Make sure it is App.jsx and not App.js
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)