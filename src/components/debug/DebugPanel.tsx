import { useState, useEffect } from 'react'


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { blink } from '@/blink/client'

export function DebugPanel() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState<any>(null)
  const [cases, setCases] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      console.log('Auth state changed:', state)
      setAuthState(state)
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const testDatabaseConnection = async () => {
    try {
      setError(null)
      console.log('Testing database connection...')
      
      if (!user?.id) {
        setError('No user ID available')
        return
      }

      console.log('User ID:', user.id)
      
      // Try to load cases
      const casesData = await blink.db.cases.list({
        where: { userId: user.id },
        limit: 5
      })
      
      console.log('Cases data:', casesData)
      setCases(casesData || [])
      
    } catch (err: any) {
      console.error('Database test error:', err)
      setError(err.message || 'Unknown error')
    }
  }

  const testRawSQL = async () => {
    try {
      setError(null)
      console.log('Testing raw SQL...')
      
      // This should work since we're using the blink_run_sql tool
      const result = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'SELECT * FROM cases LIMIT 3' })
      })
      
      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`)
      }
      
      const data = await result.json()
      console.log('Raw SQL result:', data)
      
    } catch (err: any) {
      console.error('Raw SQL test error:', err)
      setError(err.message || 'Raw SQL test failed')
    }
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Authentication Status</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? `${user.email} (${user.id})` : 'None'}</p>
              <p><strong>Is Authenticated:</strong> {authState?.isAuthenticated ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Database Test</h3>
            <Button onClick={testDatabaseConnection} disabled={!user}>
              Test Database Connection
            </Button>
            <Button onClick={testRawSQL} className="ml-2">
              Test Raw SQL
            </Button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Cases Data ({cases.length})</h3>
            <div className="bg-gray-100 p-3 rounded text-sm max-h-40 overflow-y-auto">
              <pre>{JSON.stringify(cases, null, 2)}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Auth State</h3>
            <div className="bg-gray-100 p-3 rounded text-sm max-h-40 overflow-y-auto">
              <pre>{JSON.stringify(authState, null, 2)}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}