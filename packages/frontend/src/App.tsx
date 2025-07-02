import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WalletProvider } from '@/providers/WalletProvider'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { CreateStreamPage } from '@/pages/CreateStreamPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { StreamDetailsPage } from '@/pages/StreamDetailsPage'
import '@/styles/globals.css'

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateStreamPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/stream/:id" element={<StreamDetailsPage />} />
            </Routes>
          </Layout>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'bg-white border border-gray-200 shadow-lg',
            }}
          />
        </div>
      </Router>
    </WalletProvider>
  )
}

export default App 