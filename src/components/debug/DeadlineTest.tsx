import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { blink } from '@/blink/client'



export function DeadlineTest() {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [result, setResult] = useState<string>('')
  const [deadlines, setDeadlines] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadDeadlines = async () => {
    if (!user?.id) return
    
    try {
      const deadlinesData = await blink.db.deadlines.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      
      console.log('Loaded deadlines:', deadlinesData)
      setDeadlines(deadlinesData)
    } catch (error) {
      console.error('Error loading deadlines:', error)
    }
  }

  const testCreateDeadline = async () => {
    if (!user?.id || !title || !dueDate) {
      setResult('Error: Missing user, title, or due date')
      return
    }

    try {
      setResult('Creating deadline...')
      
      const deadlineData = {
        id: `test_deadline_${Date.now()}`,
        case_id: 'test-case-123',
        title: title,
        description: 'Test deadline description',
        due_date: dueDate,
        priority: 'medium',
        type: 'deadline',
        completed: 0,
        user_id: user.id,
        created_at: new Date().toISOString()
      }

      console.log('Creating deadline with data:', deadlineData)
      
      const createResult = await blink.db.deadlines.create(deadlineData)
      console.log('Create result:', createResult)
      
      setResult(`Success! Created deadline with ID: ${deadlineData.id}`)
      
      // Reload deadlines
      loadDeadlines()
      
    } catch (error) {
      console.error('Error creating deadline:', error)
      setResult(`Error: ${error.message}`)
    }
  }

  const deleteAllTestDeadlines = async () => {
    if (!user?.id) return
    
    try {
      const testDeadlines = deadlines.filter(d => d.id.startsWith('test_deadline_'))
      
      for (const deadline of testDeadlines) {
        await blink.db.deadlines.delete(deadline.id)
      }
      
      setResult(`Deleted ${testDeadlines.length} test deadlines`)
      loadDeadlines()
    } catch (error) {
      console.error('Error deleting deadlines:', error)
      setResult(`Error deleting: ${error.message}`)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadDeadlines()
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return <div>Please log in to test deadline creation</div>
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Deadline Creation Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Test deadline title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={testCreateDeadline}>
            Create Test Deadline
          </Button>
          <Button onClick={loadDeadlines} variant="outline">
            Reload Deadlines
          </Button>
          <Button onClick={deleteAllTestDeadlines} variant="destructive">
            Delete Test Deadlines
          </Button>
        </div>
        
        {result && (
          <div className="p-3 bg-gray-100 rounded">
            <strong>Result:</strong> {result}
          </div>
        )}
        
        <div>
          <h3 className="font-medium mb-2">Current Deadlines ({deadlines.length}):</h3>
          {deadlines.length > 0 ? (
            <div className="space-y-2">
              {deadlines.map((deadline) => (
                <div key={deadline.id} className="p-2 border rounded text-sm">
                  <div><strong>ID:</strong> {deadline.id}</div>
                  <div><strong>Title:</strong> {deadline.title}</div>
                  <div><strong>Due:</strong> {deadline.due_date}</div>
                  <div><strong>Case ID:</strong> {deadline.case_id}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No deadlines found</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}