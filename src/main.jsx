import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Kopyaladığın Client ID'yi tam olarak buradaki tırnakların içine yapıştır:
const GOOGLE_CLIENT_ID = "3228179223-s8utg445qlivq1d4rp9c02c1t8gcbc6p.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)