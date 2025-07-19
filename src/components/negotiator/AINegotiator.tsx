import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  DollarSign, 
  TrendingUp,
  FileText,
  Lightbulb,
  Target,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@blinkdotnew/sdk'

// Create a single Blink client instance
const blink = createClient({
  projectId: 'ai-legal-case-manager-v6lpuuev',
  authRequired: true
})

interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    amount?: number
    caseId?: string
    action?: string
  }
}

export function AINegotiator() {
  const [selectedCase, setSelectedCase] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'AI Negotiator initialized. Select a case to begin negotiation analysis.',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [demandAmount, setDemandAmount] = useState('')
  const [currentOffer, setCurrentOffer] = useState('')
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cases, setCases] = useState<any[]>([])
  const [casesLoading, setCasesLoading] = useState(true)

  // Authentication state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setAuthLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load cases from database
  const loadCases = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setCasesLoading(true)
      const casesData = await blink.db.cases.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      
      // Transform database cases to the format expected by the component
      const transformedCases = casesData.map((case_: any) => ({
        id: case_.id,
        number: case_.caseNumber || case_.case_number,
        client: case_.clientName || case_.client_name,
        value: case_.estimatedValue || case_.estimated_value || 0,
        insuranceCompany: case_.insuranceCompany || case_.insurance_company,
        claimNumber: case_.claimNumber || case_.claim_number,
        status: case_.status,
        priority: case_.priority
      }))
      
      setCases(transformedCases)
    } catch (error) {
      console.error('Error loading cases:', error)
      // Fallback to mock data if database fails
      setCases([
        { id: '1', number: 'PI-2024-001', client: 'Sarah Johnson', value: 150000 },
        { id: '2', number: 'AUTO-2024-015', client: 'Michael Chen', value: 85000 },
        { id: '3', number: 'WC-2024-008', client: 'Lisa Rodriguez', value: 45000 }
      ])
    } finally {
      setCasesLoading(false)
    }
  }, [user?.id])

  // Load cases when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadCases()
    }
  }, [user?.id, loadCases])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedCase) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Use Blink AI to generate negotiation advice
      const { text } = await blink.ai.generateText({
        prompt: `You are an expert legal negotiator AI assistant. The user is asking about case negotiation strategy. 
        
        Case Context: ${selectedCase}
        Current Offer: $${currentOffer}
        Demand Amount: $${demandAmount}
        
        User Question: ${inputMessage}
        
        Provide specific, actionable negotiation advice including:
        1. Strategic recommendations
        2. Potential counteroffers
        3. Key leverage points
        4. Risk assessment
        
        Keep response professional and focused on legal negotiation tactics.`,
        model: 'gpt-4o-mini',
        maxTokens: 500
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: text,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error generating AI response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error generating a response. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateDemandLetter = async () => {
    if (!selectedCase || !demandAmount) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Please select a case and enter a demand amount before generating a demand letter.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    if (!user) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Please ensure you are logged in to use AI features.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    setIsLoading(true)
    
    // Add a status message
    const statusMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Generating demand letter... This may take a moment.',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, statusMessage])

    try {
      const selectedCaseData = cases.find(c => c.id === selectedCase)
      
      const { text } = await blink.ai.generateText({
        prompt: `Generate a professional demand letter for a legal case with the following details:
        
        Case: ${selectedCaseData?.number}
        Client: ${selectedCaseData?.client}
        Demand Amount: ${demandAmount}
        Current Offer: ${currentOffer || 'None'}
        
        The letter should be:
        1. Professional and legally sound
        2. Clearly state the demand amount
        3. Include key facts and damages
        4. Set a reasonable deadline for response
        5. Be persuasive but not aggressive
        
        Format as a formal business letter.`,
        model: 'gpt-4o-mini',
        maxTokens: 800
      })

      // Remove the status message and add the result
      setMessages(prev => prev.filter(msg => msg.id !== statusMessage.id))

      const letterMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `**Generated Demand Letter:**\n\n${text}`,
        timestamp: new Date(),
        metadata: { action: 'demand_letter', amount: parseInt(demandAmount) }
      }

      setMessages(prev => [...prev, letterMessage])
    } catch (error) {
      console.error('Error generating demand letter:', error)
      
      // Remove the status message
      setMessages(prev => prev.filter(msg => msg.id !== statusMessage.id))
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Failed to generate demand letter. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeSettlement = async () => {
    if (!selectedCase) return

    setIsLoading(true)
    try {
      const selectedCaseData = cases.find(c => c.id === selectedCase)
      
      const { text } = await blink.ai.generateText({
        prompt: `Analyze the settlement potential for this legal case:
        
        Case: ${selectedCaseData?.number}
        Client: ${selectedCaseData?.client}
        Estimated Value: $${selectedCaseData?.value}
        Current Offer: $${currentOffer || 'None received'}
        Demand: $${demandAmount || 'Not set'}
        
        Provide analysis on:
        1. Settlement probability (percentage)
        2. Recommended settlement range
        3. Key negotiation points
        4. Timeline expectations
        5. Risks and opportunities
        
        Be specific and data-driven in your analysis.`,
        model: 'gpt-4o-mini',
        maxTokens: 600
      })

      const analysisMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `**Settlement Analysis:**\n\n${text}`,
        timestamp: new Date(),
        metadata: { action: 'settlement_analysis' }
      }

      setMessages(prev => [...prev, analysisMessage])
    } catch (error) {
      console.error('Error analyzing settlement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Negotiator...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to use the AI Negotiator features.</p>
          <Button onClick={() => blink.auth.login()}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Negotiator</h1>
          <p className="text-gray-600">Get AI-powered negotiation strategies and generate demand letters</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Selection & Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-blue-600" />
                Case Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Case
                </label>
                <Select value={selectedCase} onValueChange={setSelectedCase} disabled={casesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={casesLoading ? "Loading cases..." : cases.length === 0 ? "No cases found" : "Choose a case"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map(case_ => (
                      <SelectItem key={case_.id} value={case_.id}>
                        {case_.number} - {case_.client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cases.length === 0 && !casesLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    No cases found. Create a case first in the Cases tab.
                  </p>
                )}
              </div>

              {selectedCase && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Current Offer ($)
                    </label>
                    <Input
                      type="number"
                      value={currentOffer}
                      onChange={(e) => setCurrentOffer(e.target.value)}
                      placeholder="Enter current offer"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Demand Amount ($)
                    </label>
                    <Input
                      type="number"
                      value={demandAmount}
                      onChange={(e) => setDemandAmount(e.target.value)}
                      placeholder="Enter demand amount"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-amber-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={generateDemandLetter}
                disabled={!selectedCase || !demandAmount || isLoading}
              >
                <FileText className="mr-2 h-4 w-4" />
                {isLoading ? 'Generating...' : 'Generate Demand Letter'}
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={analyzeSettlement}
                disabled={!selectedCase || isLoading}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {isLoading ? 'Analyzing...' : 'Analyze Settlement'}
              </Button>
            </CardContent>
          </Card>

          {/* Negotiation Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-green-600" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Start with a strong initial demand</p>
                <p>• Document all communications</p>
                <p>• Set clear deadlines</p>
                <p>• Know your bottom line</p>
                <p>• Use AI analysis to strengthen position</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
                Negotiation Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4 mb-4" style={{ height: '400px' }}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'ai' ? 'bg-blue-100' : 
                        message.type === 'user' ? 'bg-gray-100' : 'bg-amber-100'
                      }`}>
                        {message.type === 'ai' ? (
                          <Bot className="h-4 w-4 text-blue-600" />
                        ) : message.type === 'user' ? (
                          <User className="h-4 w-4 text-gray-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.type === 'ai' ? 'AI Assistant' : 
                             message.type === 'user' ? 'You' : 'System'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.metadata?.action && (
                            <Badge variant="outline" className="text-xs">
                              {message.metadata.action.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">AI is thinking...</div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              {/* Input */}
              <div className="flex space-x-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={selectedCase ? "Ask about negotiation strategy..." : "Select a case first"}
                  className="flex-1 min-h-[60px]"
                  disabled={!selectedCase}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !selectedCase || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}