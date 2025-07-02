import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Shield, Zap, Users, DollarSign, Repeat } from 'lucide-react'

export function HomePage() {
  const features = [
    {
      icon: Clock,
      title: 'Automated Streaming',
      description: 'Set up token streams that run automatically without any manual intervention.',
    },
    {
      icon: Shield,
      title: 'Fully On-Chain',
      description: 'No backends, no oracles, no external dependencies. Pure blockchain automation.',
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Create streams in seconds with our intuitive interface.',
    },
    {
      icon: Users,
      title: 'Multiple Use Cases',
      description: 'Perfect for payroll, vesting, subscriptions, and donations.',
    },
  ]

  const useCases = [
    {
      icon: DollarSign,
      title: 'Payroll Automation',
      description: 'DAOs and companies can stream salaries automatically per block, week, or month.',
    },
    {
      icon: Repeat,
      title: 'Contributor Vesting',
      description: 'Developers receive tokens gradually after grants or contributions.',
    },
    {
      icon: Clock,
      title: 'Subscriptions',
      description: 'Users pay small recurring fees to access on-chain services.',
    },
    {
      icon: Users,
      title: 'Micro-donations',
      description: 'Send small amounts regularly to support public goods and causes.',
    },
  ]

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center py-16 sm:py-24">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-6xl">
            <span className="block">Fully On-Chain</span>
            <span className="block text-blue-600">Token Streaming</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto">
            AutoStream enables automatic, recurring token payments on Massa blockchain. 
            No backends, no keepers, no external dependencies. Just pure on-chain automation.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              to="/create"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Create Stream
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why AutoStream?
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Built on Massa's unique Autonomous Smart Contracts technology
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="text-center">
                  <div className="flex justify-center">
                    <Icon className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Use Cases
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Perfect for any recurring payment scenario
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {useCases.map((useCase) => {
              const Icon = useCase.icon
              return (
                <div key={useCase.title} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <Icon className="h-8 w-8 text-blue-600" />
                    <h3 className="ml-3 text-xl font-medium text-gray-900">
                      {useCase.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-gray-600">
                    {useCase.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-blue-200">Create your first stream today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/create"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                Get started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 