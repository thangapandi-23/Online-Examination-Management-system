import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Poppins, Inter, sans-serif',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
            success: { iconTheme: { primary: '#4CAF50', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
