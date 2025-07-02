import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Droplets, Plus, BarChart3, Wallet } from 'lucide-react'
import { WalletConnect } from './WalletConnect'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  
  const navigation = [
    { name: 'Home', href: '/', icon: Droplets },
    { name: 'Create Stream', href: '/create', icon: Plus },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  ]
  
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Droplets className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">AutoStream</span>
              </Link>
              
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                        isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center">
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 