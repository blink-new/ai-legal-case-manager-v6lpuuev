import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  created_at: string
  total_cases: number
  active_cases: number
  total_settlements: number
}

interface ClientCase {
  id: string
  case_number: string
  case_type: string
  status: string
  created_at: string
  settlement_amount?: string
  description: string
}

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientCases, setClientCases] = useState<ClientCase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false)
  const [isClientDetailDialogOpen, setIsClientDetailDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const { toast } = useToast()

  const loadClients = useCallback(async () => {
    try {
      // Get all cases to extract unique clients
      const casesResult = await blink.db.cases.list({
        orderBy: { createdAt: 'desc' }
      })

      console.log('🔍 DEBUG: Cases loaded:', casesResult?.length || 0)
      console.log('🔍 DEBUG: Cases data:', casesResult)

      if (casesResult) {
        // Group cases by client to create client summary
        const clientMap = new Map<string, Client>()
        
        casesResult.forEach((case_: any) => {
          const clientName = case_.client_name || case_.clientName || 'Unknown Client'
          console.log('🔍 DEBUG: Processing case for client:', clientName, 'Case:', case_.case_number || case_.caseNumber)
          console.log('🔍 DEBUG: Full case object:', case_)
          
          if (!clientMap.has(clientName)) {
            clientMap.set(clientName, {
              id: clientName.toLowerCase().replace(/\s+/g, '-'),
              name: clientName,
              email: case_.client_email || case_.clientEmail || `${clientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
              phone: case_.client_phone || case_.clientPhone || '(555) 000-0000',
              address: case_.client_address || case_.clientAddress || '',
              created_at: case_.created_at || case_.createdAt,
              total_cases: 0,
              active_cases: 0,
              total_settlements: 0
            })
          }

          const client = clientMap.get(clientName)!
          client.total_cases++
          
          if (case_.status === 'active' || case_.status === 'new') {
            client.active_cases++
          }
          
          if (case_.current_offer || case_.currentOffer) {
            client.total_settlements += Number(case_.current_offer || case_.currentOffer) || 0
          }
        })

        const clientsArray = Array.from(clientMap.values())
        console.log('🔍 DEBUG: Final clients array:', clientsArray)
        setClients(clientsArray)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error",
        description: "Failed to load client information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const loadClientCases = async (clientName: string) => {
    try {
      console.log('🔍 DEBUG: Loading cases for client:', clientName)
      console.log('🔍 DEBUG: Client name type:', typeof clientName)
      console.log('🔍 DEBUG: Client name length:', clientName.length)
      console.log('🔍 DEBUG: Client name chars:', clientName.split('').map(c => c.charCodeAt(0)))
      
      // First, let's see all cases to debug
      const allCases = await blink.db.cases.list({
        orderBy: { createdAt: 'desc' }
      })
      console.log('🔍 DEBUG: All cases in database:', allCases?.length || 0)
      
      // Check exact matches
      const exactMatches = allCases?.filter(c => {
        const dbName = c.client_name || c.clientName
        console.log('🔍 DEBUG: Comparing:', `"${clientName}"`, 'vs', `"${dbName}"`)
        console.log('🔍 DEBUG: Exact match?', clientName === dbName)
        console.log('🔍 DEBUG: Trimmed match?', clientName.trim() === dbName?.trim())
        return dbName === clientName
      })
      console.log('🔍 DEBUG: Exact matches found:', exactMatches?.length || 0)
      
      // Try multiple approaches to find the cases
      let casesResult = []
      
      // Approach 1: Direct database query
      try {
        casesResult = await blink.db.cases.list({
          where: { client_name: clientName },
          orderBy: { created_at: 'desc' }
        })
        console.log('🔍 DEBUG: Approach 1 (client_name filter):', casesResult?.length || 0)
      } catch (e) {
        console.log('🔍 DEBUG: Approach 1 failed:', e)
      }
      
      // Approach 2: If no results, try camelCase
      if (!casesResult || casesResult.length === 0) {
        try {
          casesResult = await blink.db.cases.list({
            where: { clientName: clientName },
            orderBy: { createdAt: 'desc' }
          })
          console.log('🔍 DEBUG: Approach 2 (clientName filter):', casesResult?.length || 0)
        } catch (e) {
          console.log('🔍 DEBUG: Approach 2 failed:', e)
        }
      }
      
      // Approach 3: If still no results, filter manually from all cases
      if (!casesResult || casesResult.length === 0) {
        console.log('🔍 DEBUG: Approach 3 - Manual filtering from all cases')
        casesResult = allCases?.filter(case_ => {
          const dbClientName = case_.client_name || case_.clientName
          return dbClientName === clientName || dbClientName?.trim() === clientName.trim()
        }) || []
        console.log('🔍 DEBUG: Approach 3 results:', casesResult?.length || 0)
      }
      
      console.log('🔍 DEBUG: Final cases found for', clientName, ':', casesResult?.length || 0)
      console.log('🔍 DEBUG: Case details:', casesResult)
      
      // Convert to the format expected by the UI
      const formattedCases = casesResult?.map((case_: any) => ({
        id: case_.id,
        case_number: case_.case_number || case_.caseNumber,
        case_type: case_.case_type || case_.caseType,
        status: case_.status,
        created_at: case_.created_at || case_.createdAt,
        settlement_amount: (case_.current_offer || case_.currentOffer)?.toString() || '',
        description: case_.description
      })) || []
      
      console.log('🔍 DEBUG: Formatted cases for UI:', formattedCases)
      setClientCases(formattedCases)
    } catch (error) {
      console.error('Error loading client cases:', error)
      toast({
        title: "Error",
        description: "Failed to load client cases",
        variant: "destructive"
      })
    }
  }

  const addClient = async () => {
    if (!newClient.name.trim() || !newClient.email.trim()) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive"
      })
      return
    }

    try {
      // For now, we'll create a placeholder case for the new client
      // In a real app, you'd have a separate clients table
      await blink.db.cases.create({
        case_number: `CLIENT-SETUP-${Date.now()}`,
        client_name: newClient.name,
        client_email: newClient.email,
        client_phone: newClient.phone,
        client_address: newClient.address,
        case_type: 'other',
        status: 'new',
        description: 'Initial client setup - consultation scheduled',
        created_at: new Date().toISOString(),
        user_id: 'current-user' // This would be the actual user ID
      })

      toast({
        title: "Success",
        description: "Client added successfully"
      })

      setNewClient({ name: '', email: '', phone: '', address: '' })
      setIsAddClientDialogOpen(false)
      loadClients()
    } catch (error) {
      console.error('Error adding client:', error)
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive"
      })
    }
  }

  const viewClientDetails = async (client: Client) => {
    setSelectedClient(client)
    await loadClientCases(client.name)
    setIsClientDetailDialogOpen(true)
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'settled': return 'bg-green-100 text-green-800'
      case 'new': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading clients...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage your clients and their cases</p>
        </div>
        <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your practice
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="john.smith@email.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addClient}>
                  Add Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Cases</p>
                <p className="text-xl font-bold">{clients.reduce((sum, client) => sum + client.active_cases, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Total Settlements</p>
                <p className="text-xl font-bold">{formatCurrency(clients.reduce((sum, client) => sum + client.total_settlements, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-xl font-bold">{clients.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>Overview of all your clients and their cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">
                      {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {client.email}
                      </span>
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {client.phone}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{client.total_cases}</p>
                    <p className="text-xs text-gray-500">Total Cases</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{client.active_cases}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{formatCurrency(client.total_settlements)}</p>
                    <p className="text-xs text-gray-500">Settlements</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => viewClientDetails(client)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No clients match your search criteria' : 'Add your first client to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddClientDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Detail Dialog */}
      <Dialog open={isClientDetailDialogOpen} onOpenChange={setIsClientDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              {selectedClient?.name} - Complete client information and case history
            </DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Client Info</TabsTrigger>
                <TabsTrigger value="cases">Cases ({clientCases.length})</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{selectedClient.name}</p>
                          <p className="text-sm text-gray-500">Full Name</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{selectedClient.email}</p>
                          <p className="text-sm text-gray-500">Email Address</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{selectedClient.phone}</p>
                          <p className="text-sm text-gray-500">Phone Number</p>
                        </div>
                      </div>
                      {selectedClient.address && (
                        <>
                          <Separator />
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{selectedClient.address}</p>
                              <p className="text-sm text-gray-500">Address</p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Case Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{selectedClient.total_cases}</p>
                          <p className="text-sm text-blue-800">Total Cases</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{selectedClient.active_cases}</p>
                          <p className="text-sm text-green-800">Active Cases</p>
                        </div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xl font-bold text-yellow-600">{formatCurrency(selectedClient.total_settlements)}</p>
                        <p className="text-sm text-yellow-800">Total Settlements</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Client since</p>
                        <p className="font-medium">{new Date(selectedClient.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="cases" className="space-y-4">
                <div className="space-y-3">
                  {clientCases.map((case_) => (
                    <Card key={case_.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{case_.case_number}</h4>
                              <Badge className={getStatusColor(case_.status)}>
                                {case_.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{case_.case_type.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-sm text-gray-500">{case_.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="font-medium">{new Date(case_.created_at).toLocaleDateString()}</p>
                            {case_.settlement_amount && (
                              <p className="text-green-600 font-medium mt-1">
                                {formatCurrency(Number(case_.settlement_amount))}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {clientCases.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No cases found for this client</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Activity timeline coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}