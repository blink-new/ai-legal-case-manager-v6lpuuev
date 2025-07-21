import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SimpleTest() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('Click the button to test!')

  const handleClick = () => {
    setCount(prev => prev + 1)
    setMessage(`Button clicked ${count + 1} times!`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Simple Test</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Button 
          onClick={handleClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Test Button (Count: {count})
        </Button>
        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-500">If you can see this and the button works, the app is functioning correctly.</p>
          <p className="text-xs text-gray-400">Build time: {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  )
}