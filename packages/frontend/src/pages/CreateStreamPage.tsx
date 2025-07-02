import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, DollarSign, Clock, User } from 'lucide-react'

interface StreamForm {
  recipient: string
  amount: string
  duration: string
  interval: string
  streamType: 'time' | 'block'
}

export function CreateStreamPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<StreamForm>({
    recipient: '',
    amount: '',
    duration: '',
    interval: '3600', // 1 hour default
    streamType: 'time'
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      // Mock stream creation - replace with actual contract call
      console.log('Creating stream:', form)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Navigate to dashboard after creation
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to create stream:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const updateForm = (field: keyof StreamForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const intervalOptions = [
    { value: '60', label: '1 minute' },
    { value: '3600', label: '1 hour' },
    { value: '86400', label: '1 day' },
    { value: '604800', label: '1 week' },
    { value: '2592000', label: '1 month' },
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Stream</h1>
        <p className="mt-2 text-gray-600">
          Set up automatic, recurring token payments on Massa blockchain
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <User className="inline h-4 w-4 mr-1" />
              Recipient Address
            </label>
            <input
              type="text"
              required
              value={form.recipient}
              onChange={(e) => updateForm('recipient', e.target.value)}
              placeholder="AS12k3fg7hj8...xyz789"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Total Amount (MAS)
            </label>
            <input
              type="number"
              required
              step="0.000001"
              min="0"
              value={form.amount}
              onChange={(e) => updateForm('amount', e.target.value)}
              placeholder="100.0"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="inline h-4 w-4 mr-1" />
              Duration (seconds)
            </label>
            <input
              type="number"
              required
              min="1"
              value={form.duration}
              onChange={(e) => updateForm('duration', e.target.value)}
              placeholder="2592000"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Total time the stream will run (e.g., 2592000 = 30 days)
            </p>
          </div>

          {/* Payment Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Clock className="inline h-4 w-4 mr-1" />
              Payment Interval
            </label>
            <select
              value={form.interval}
              onChange={(e) => updateForm('interval', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {intervalOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              How often payments are made
            </p>
          </div>

          {/* Stream Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Stream Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="streamType"
                  value="time"
                  checked={form.streamType === 'time'}
                  onChange={(e) => updateForm('streamType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Time-based (seconds)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="streamType"
                  value="block"
                  checked={form.streamType === 'block'}
                  onChange={(e) => updateForm('streamType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Block-based</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Stream
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 