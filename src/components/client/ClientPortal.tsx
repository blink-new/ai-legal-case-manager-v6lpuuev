import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Send,
  Download,
  Eye,
  Phone,
  Mail,
  User,
  Building,
  MapPin
} from 'lucide-react'


import { useToast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'

interface ClientCase {
  id: string
  case_number: string
  case_type: string
  status: string
  created_at: string
  settlement_amount?: string
  description: string
  next_hearing?: string
  progress: number
}

interface ClientMessage {
  id: string
  case_id: string
  message: string
  sender: 'client' | 'attorney'
  created_at: string
  read: boolean
}

interface ClientDocument {
  id: string
  case_id: string
  name: string
  type: string
  upload_date: string
  url?: string
  description?: string
}

export function ClientPortal() {
  const [cases, setCases] = useState<ClientCase[]>([])
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [newMessage, setNewMessage] = useState('')
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const { toast } = useToast()

  // Mock client info - in real app, this would come from auth
  const clientInfo = {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St, City, State 12345',
    attorney: 'Sarah Johnson, Esq.',
    firm: 'Johnson & Associates Law Firm'
  }

  const loadClientData = async () => {
    try {
      // Load client's cases
      const casesResult = await blink.db.cases.list({
        where: { client_name: clientInfo.name },
        orderBy: { created_at: 'desc' }
      })
      setCases(casesResult || [])

      // Load messages for client's cases
      if (casesResult && casesResult.length > 0) {
        const caseIds = casesResult.map(c => c.id)
        // In a real app, you'd filter messages by case IDs
        const messagesResult = await blink.db.client_messages?.list({
          orderBy: { created_at: 'desc' },
          limit: 50
        }) || []
        setMessages(messagesResult)

        // Load documents
        const documentsResult = await blink.db.client_documents?.list({
          orderBy: { upload_date: 'desc' }
        }) || []
        setDocuments(documentsResult)
      }
    } catch (error) {
      console.error('Error loading client data:', error)
      toast({
        title: "Error",
        description: "Failed to load your case information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCase) return

    try {
      await blink.db.client_messages?.create({
        case_id: selectedCase,
        message: newMessage,
        sender: 'client',
        created_at: new Date().toISOString(),
        read: false
      })

      toast({
        title: "Message Sent",
        description: "Your message has been sent to your attorney"
      })

      setNewMessage('')
      setMessageDialogOpen(false)
      loadClientData()
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'settled': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <Clock className="h-4 w-4" />
      case 'settled': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <AlertCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return 'Pending'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading your cases...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {clientInfo.name}</h1>
            <p className="text-blue-100 mt-1">Track your cases and communicate with your legal team</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Your Attorney</p>
            <p className="font-semibold">{clientInfo.attorney}</p>
            <p className="text-sm text-blue-100">{clientInfo.firm}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cases</p>
                <p className="text-xl font-bold">{cases.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Active Cases</p>
                <p className="text-xl font-bold">{cases.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Settled Cases</p>
                <p className="text-xl font-bold">{cases.filter(c => c.status === 'settled').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-xl font-bold">{messages.filter(m => !m.read && m.sender === 'attorney').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cases" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cases">My Cases</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Cases</h2>
            <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Message to Attorney</DialogTitle>
                  <DialogDescription>
                    Send a message about your case to your legal team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="case-select">Select Case</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedCase}
                      onChange={(e) => setSelectedCase(e.target.value)}
                    >
                      <option value="">Choose a case</option>
                      {cases.map((case_) => (
                        <option key={case_.id} value={case_.id}>
                          {case_.case_number} - {case_.case_type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button onClick={sendMessage} disabled={!selectedCase || !newMessage.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cases.map((case_) => (
              <Card key={case_.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{case_.case_number}</CardTitle>
                    <Badge className={getStatusColor(case_.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(case_.status)}
                        <span>{case_.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <CardDescription>{case_.case_type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{case_.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Case Progress</span>
                      <span>{case_.progress}%</span>
                    </div>
                    <Progress value={case_.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Started</p>
                      <p className="font-medium">{new Date(case_.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Settlement</p>
                      <p className="font-medium">{formatCurrency(case_.settlement_amount)}</p>
                    </div>
                  </div>

                  {case_.next_hearing && (
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Next Hearing</p>
                        <p className="text-sm text-blue-700">{new Date(case_.next_hearing).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {cases.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                <p className="text-gray-500">Your cases will appear here once they are created</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Communication with your legal team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`p-4 rounded-lg ${
                    message.sender === 'client' 
                      ? 'bg-blue-50 ml-8' 
                      : 'bg-gray-50 mr-8'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {message.sender === 'client' ? 'You' : clientInfo.attorney}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Documents</CardTitle>
              <CardDescription>Important documents related to your cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          {doc.description || 'Case document'} • {new Date(doc.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.url && (
                        <>
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.url} download>
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No documents available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your contact details and information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{clientInfo.name}</p>
                    <p className="text-sm text-gray-500">Full Name</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{clientInfo.email}</p>
                    <p className="text-sm text-gray-500">Email Address</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{clientInfo.phone}</p>
                    <p className="text-sm text-gray-500">Phone Number</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{clientInfo.address}</p>
                    <p className="text-sm text-gray-500">Address</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legal Team</CardTitle>
                <CardDescription>Your assigned attorney and law firm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{clientInfo.attorney}</p>
                    <p className="text-sm text-gray-500">Primary Attorney</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{clientInfo.firm}</p>
                    <p className="text-sm text-gray-500">Law Firm</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick Actions</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}