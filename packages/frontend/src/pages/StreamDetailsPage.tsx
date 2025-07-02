import React from 'react'
import { useParams } from 'react-router-dom'

export function StreamDetailsPage() {
  const { id } = useParams()
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Stream Details</h1>
      <p className="mt-2 text-gray-600">Stream ID: {id}</p>
      {/* Stream details will be implemented */}
    </div>
  )
} 