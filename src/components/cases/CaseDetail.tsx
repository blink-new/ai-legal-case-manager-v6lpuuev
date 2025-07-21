import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft,
  Edit,
  Save,
  X,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  CalendarPlus,
  Target,
  Bell
} from 'lucide-react'
import { Case, Document } from '@/types/case'


import { useToast } from '@/hooks/use-toast'

interface CaseDetailProps {
  caseId: string
  onBack: () => void
  onNavigate?: (tab: string, caseId?: string) => void
}

export function CaseDetail({ caseId, onBack, onNavigate }: CaseDetailProps) {
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  // Form state for editing
  const [formData, setFormData] = useState<Partial<Case>>({})

  // Deadline/Timeline management state
  const [deadlines, setDeadlines] = useState<Array<{
    id: string
    title: string
    description: string
    dueDate: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    type: 'deadline' | 'milestone' | 'reminder'
    completed: boolean
    createdAt: string
  }>>([])
  const [isDeadlineDialogOpen, setIsDeadlineDialogOpen] = useState(false)
  const [isCaseEditDialogOpen, setIsCaseEditDialogOpen] = useState(false)
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    type: 'deadline' as 'deadline' | 'milestone' | 'reminder'
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadCaseData = useCallback(async () => {
    if (!user?.id || !caseId) return

    try {
      setLoading(true)
      
      // Load case data
      const cases = await blink.db.cases.list({
        where: { 
          id: caseId,
          userId: user.id
        }
      })

      if (cases.length > 0) {
        const case_ = cases[0]
        setCaseData(case_)
        setFormData(case_)
      } else {
        // Use mock data if case not found
        const mockCase: Case = {
          id: caseId,
          caseNumber: 'PI-2024-001',
          clientName: 'Sarah Johnson',
          clientEmail: 'sarah.johnson@email.com',
          clientPhone: '(555) 123-4567',
          incidentDate: '2023-12-15',
          caseType: 'personal_injury',
          status: 'negotiating',
          priority: 'high',
          insuranceCompany: 'State Farm',
          claimNumber: 'SF-789456123',
          estimatedValue: 150000,
          currentOffer: 85000,
          description: 'Slip and fall accident at grocery store resulting in back injury. Client sustained herniated disc requiring physical therapy and potential surgery.',
          assignedAttorney: 'John Doe',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-18',
          userId: user.id,
          nextDeadline: '2024-01-25',
          settlementGoal: 175000
        }
        setCaseData(mockCase)
        setFormData(mockCase)
      }

      // Load documents
      try {
        const docs = await blink.db.documents.list({
          where: { 
            caseId: caseId,
            userId: user.id
          },
          orderBy: { uploadedAt: 'desc' }
        })
        setDocuments(docs || [])
      } catch (error) {
        console.error('Error loading documents:', error)
        // Use mock documents
        setDocuments([
          {
            id: '1',
            caseId,
            fileName: 'Medical_Records.pdf',
            fileType: 'application/pdf',
            fileSize: 2048576,
            uploadedAt: '2024-01-10T10:00:00Z',
            category: 'medical',
            publicUrl: '#',
            userId: user.id
          },
          {
            id: '2',
            caseId,
            fileName: 'Police_Report.pdf',
            fileType: 'application/pdf',
            fileSize: 1024768,
            uploadedAt: '2024-01-11T14:30:00Z',
            category: 'police_report',
            publicUrl: '#',
            userId: user.id
          }
        ])
      }

      // Load deadlines from database
      try {
        console.log('Loading deadlines for case:', caseId, 'user:', user.id)
        const deadlinesData = await blink.db.deadlines.list({
          where: { 
            case_id: caseId,  // Use snake_case
            user_id: user.id  // Use snake_case
          },
          orderBy: { due_date: 'asc' }  // Use snake_case
        })
        
        console.log('Loaded deadlines from DB:', deadlinesData)
        
        // Convert database format to component format
        const formattedDeadlines = deadlinesData.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          dueDate: d.due_date,  // Convert from snake_case
          priority: d.priority as 'low' | 'medium' | 'high' | 'urgent',
          type: d.type as 'deadline' | 'milestone' | 'reminder',
          completed: Number(d.completed) > 0, // Convert SQLite boolean
          createdAt: d.created_at  // Convert from snake_case
        }))
        
        console.log('Formatted deadlines:', formattedDeadlines)
        setDeadlines(formattedDeadlines)
      } catch (error) {
        console.error('Error loading deadlines:', error)
        setDeadlines([])
      }

    } catch (error) {
      console.error('Error loading case:', error)
      toast({
        title: "Error",
        description: "Failed to load case details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [caseId, user?.id, toast])

  useEffect(() => {
    if (user?.id) {
      loadCaseData()
    }
  }, [loadCaseData, user?.id])

  const handleSave = async () => {
    if (!user?.id || !caseData) return

    try {
      setSaving(true)
      
      await blink.db.cases.update(caseData.id, {
        ...formData,
        updatedAt: new Date().toISOString()
      })

      setCaseData({ ...caseData, ...formData, updatedAt: new Date().toISOString() })
      setEditing(false)
      
      toast({
        title: "Success",
        description: "Case updated successfully"
      })

    } catch (error) {
      console.error('Error updating case:', error)
      toast({
        title: "Error",
        description: "Failed to update case",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'negotiating': return 'bg-orange-100 text-orange-800'
      case 'settled': return 'bg-green-100 text-green-800'
      case 'litigation': return 'bg-red-100 text-red-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Deadline management functions
  const handleCreateDeadline = async () => {
    if (!newDeadline.title || !newDeadline.dueDate || !user?.id || !caseId) {
      toast({
        title: "Error",
        description: "Please fill in title and due date",
        variant: "destructive"
      })
      return
    }

    try {
      // Save to database - using snake_case field names to match DB schema exactly
      const deadlineData = {
        id: `deadline_${Date.now()}`,
        case_id: caseId,  // Use snake_case
        title: newDeadline.title,
        description: newDeadline.description || '',
        due_date: newDeadline.dueDate,  // Use snake_case
        priority: newDeadline.priority,
        type: newDeadline.type,
        completed: 0, // SQLite boolean as integer
        user_id: user.id,  // Use snake_case
        created_at: new Date().toISOString()  // Use snake_case
      }

      console.log('Creating deadline with data:', deadlineData)
      const result = await blink.db.deadlines.create(deadlineData)
      console.log('Deadline creation result:', result)

      // Update local state
      const deadline = {
        id: deadlineData.id,
        title: newDeadline.title,
        description: newDeadline.description || '',
        dueDate: newDeadline.dueDate,
        priority: newDeadline.priority,
        type: newDeadline.type,
        completed: false,
        createdAt: new Date().toISOString()
      }

      setDeadlines(prev => [...prev, deadline])
      
      // Reset form
      setNewDeadline({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        type: 'deadline'
      })
      setIsDeadlineDialogOpen(false)

      toast({
        title: "Success",
        description: "Deadline created successfully"
      })
    } catch (error) {
      console.error('Error creating deadline:', error)
      console.error('Error details:', error.message, error.stack)
      toast({
        title: "Error",
        description: `Failed to create deadline: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      })
    }
  }

  const toggleDeadlineComplete = async (deadlineId: string) => {
    try {
      const deadline = deadlines.find(d => d.id === deadlineId)
      if (!deadline) return

      const newCompleted = !deadline.completed
      
      // Update in database
      await blink.db.deadlines.update(deadlineId, {
        completed: newCompleted ? 1 : 0 // SQLite boolean as integer
      })

      // Update local state
      setDeadlines(prev => prev.map(d => 
        d.id === deadlineId ? { ...d, completed: newCompleted } : d
      ))

      toast({
        title: "Success",
        description: `Deadline ${newCompleted ? 'completed' : 'reopened'}`
      })
    } catch (error) {
      console.error('Error updating deadline:', error)
      toast({
        title: "Error",
        description: "Failed to update deadline",
        variant: "destructive"
      })
    }
  }

  const deleteDeadline = async (deadlineId: string) => {
    try {
      // Delete from database
      await blink.db.deadlines.delete(deadlineId)

      // Update local state
      setDeadlines(prev => prev.filter(d => d.id !== deadlineId))
      
      toast({
        title: "Success",
        description: "Deadline deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting deadline:', error)
      toast({
        title: "Error",
        description: "Failed to delete deadline",
        variant: "destructive"
      })
    }
  }

  const getDeadlineTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <AlertTriangle className="h-4 w-4" />
      case 'milestone': return <Target className="h-4 w-4" />
      case 'reminder': return <Bell className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getDeadlineTypeColor = (type: string) => {
    switch (type) {
      case 'deadline': return 'bg-red-100 text-red-800'
      case 'milestone': return 'bg-blue-100 text-blue-800'
      case 'reminder': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading case details...</p>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Case Not Found</h3>
        <p className="text-gray-600 mb-4">The requested case could not be found.</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cases
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{caseData.caseNumber}</h1>
            <p className="text-gray-600">{caseData.clientName} - {caseData.caseType.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => {
                setEditing(false)
                setFormData(caseData)
              }}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Case
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(caseData.status)}>
                  {caseData.status}
                </Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <Badge className={getPriorityColor(caseData.priority)}>
                  {caseData.priority}
                </Badge>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estimated Value</p>
                <p className="text-lg font-semibold">${caseData.estimatedValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Deadline</p>
                <p className="text-lg font-semibold">
                  {caseData.nextDeadline 
                    ? new Date(caseData.nextDeadline).toLocaleDateString()
                    : 'None set'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Phone</Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{caseData.clientName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{caseData.clientEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{caseData.clientPhone}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Case Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Case Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="caseType">Case Type</Label>
                      <Select 
                        value={formData.caseType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, caseType: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal_injury">Personal Injury</SelectItem>
                          <SelectItem value="auto_accident">Auto Accident</SelectItem>
                          <SelectItem value="workers_comp">Workers Compensation</SelectItem>
                          <SelectItem value="medical_malpractice">Medical Malpractice</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incidentDate">Incident Date</Label>
                      <Input
                        id="incidentDate"
                        type="date"
                        value={formData.incidentDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignedAttorney">Assigned Attorney</Label>
                      <Input
                        id="assignedAttorney"
                        value={formData.assignedAttorney || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, assignedAttorney: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-sm text-gray-600">Case Type:</span>
                      <p className="font-medium capitalize">{caseData.caseType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Incident Date:</span>
                      <p className="font-medium">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Assigned Attorney:</span>
                      <p className="font-medium">{caseData.assignedAttorney}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceCompany">Insurance Company</Label>
                      <Input
                        id="insuranceCompany"
                        value={formData.insuranceCompany || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claimNumber">Claim Number</Label>
                      <Input
                        id="claimNumber"
                        value={formData.claimNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, claimNumber: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-sm text-gray-600">Company:</span>
                      <p className="font-medium">{caseData.insuranceCompany}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Claim Number:</span>
                      <p className="font-medium">{caseData.claimNumber || 'Not provided'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                      <Input
                        id="estimatedValue"
                        type="number"
                        value={formData.estimatedValue || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="settlementGoal">Settlement Goal ($)</Label>
                      <Input
                        id="settlementGoal"
                        type="number"
                        value={formData.settlementGoal || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, settlementGoal: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-sm text-gray-600">Estimated Value:</span>
                      <p className="font-medium text-lg">${caseData.estimatedValue.toLocaleString()}</p>
                    </div>
                    {caseData.currentOffer && (
                      <div>
                        <span className="text-sm text-gray-600">Current Offer:</span>
                        <p className="font-medium text-lg">${caseData.currentOffer.toLocaleString()}</p>
                      </div>
                    )}
                    {caseData.settlementGoal && (
                      <div>
                        <span className="text-sm text-gray-600">Settlement Goal:</span>
                        <p className="font-medium text-lg">${caseData.settlementGoal.toLocaleString()}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Case Description */}
          <Card>
            <CardHeader>
              <CardTitle>Case Description</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Enter case description..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{caseData.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Deadlines & Timeline Management - Only show when editing */}
          {editing && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <CalendarPlus className="mr-2 h-5 w-5" />
                  Deadlines & Timeline
                </CardTitle>
                <Dialog open={isDeadlineDialogOpen} onOpenChange={setIsDeadlineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Deadline
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Deadline</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="deadlineTitle">Title *</Label>
                        <Input
                          id="deadlineTitle"
                          placeholder="e.g., File motion, Discovery deadline, Settlement conference"
                          value={newDeadline.title}
                          onChange={(e) => setNewDeadline(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadlineDescription">Description</Label>
                        <Textarea
                          id="deadlineDescription"
                          placeholder="Additional details about this deadline..."
                          value={newDeadline.description}
                          onChange={(e) => setNewDeadline(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deadlineDueDate">Due Date *</Label>
                          <Input
                            id="deadlineDueDate"
                            type="datetime-local"
                            value={newDeadline.dueDate}
                            onChange={(e) => setNewDeadline(prev => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deadlinePriority">Priority</Label>
                          <Select 
                            value={newDeadline.priority} 
                            onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                              setNewDeadline(prev => ({ ...prev, priority: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadlineType">Type</Label>
                        <Select 
                          value={newDeadline.type} 
                          onValueChange={(value: 'deadline' | 'milestone' | 'reminder') => 
                            setNewDeadline(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deadline">Legal Deadline</SelectItem>
                            <SelectItem value="milestone">Case Milestone</SelectItem>
                            <SelectItem value="reminder">Reminder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDeadlineDialogOpen(false)
                          setNewDeadline({
                            title: '',
                            description: '',
                            dueDate: '',
                            priority: 'medium',
                            type: 'deadline'
                          })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDeadline}>
                        Create Deadline
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <CalendarPlus className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">Deadline Management</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Deadlines can be created manually in the case manager for better case tracking and organization. 
                    Set legal deadlines, case milestones, and important reminders to stay on top of your cases.
                  </p>
                </div>

                {deadlines.length > 0 ? (
                  <div className="space-y-3">
                    {deadlines
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map((deadline) => (
                        <div 
                          key={deadline.id} 
                          className={`p-4 border rounded-lg ${deadline.completed ? 'bg-gray-50 opacity-75' : 'bg-white'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex items-center space-x-2 mt-1">
                                <input
                                  type="checkbox"
                                  checked={deadline.completed}
                                  onChange={() => toggleDeadlineComplete(deadline.id)}
                                  className="rounded border-gray-300"
                                />
                                {getDeadlineTypeIcon(deadline.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className={`font-medium ${deadline.completed ? 'line-through text-gray-500' : ''}`}>
                                    {deadline.title}
                                  </h4>
                                  <Badge className={getDeadlineTypeColor(deadline.type)}>
                                    {deadline.type}
                                  </Badge>
                                  <Badge className={getPriorityColor(deadline.priority)}>
                                    {deadline.priority}
                                  </Badge>
                                </div>
                                {deadline.description && (
                                  <p className={`text-sm mb-2 ${deadline.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {deadline.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Due: {new Date(deadline.dueDate).toLocaleString()}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Created: {new Date(deadline.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteDeadline(deadline.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No deadlines set for this case</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Create deadlines to track important dates, legal deadlines, and case milestones
                    </p>
                    <Button 
                      onClick={() => setIsDeadlineDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Deadline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Case Documents</CardTitle>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {doc.category.replace('_', ' ')} • {formatFileSize(doc.fileSize)} • 
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents uploaded yet</p>
                  <Button className="mt-4">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Case Timeline
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Dialog open={isCaseEditDialogOpen} onOpenChange={setIsCaseEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Case
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Case Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Client Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Client Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="editClientName">Client Name</Label>
                            <Input
                              id="editClientName"
                              value={formData.clientName || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editClientEmail">Email</Label>
                            <Input
                              id="editClientEmail"
                              type="email"
                              value={formData.clientEmail || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editClientPhone">Phone</Label>
                            <Input
                              id="editClientPhone"
                              value={formData.clientPhone || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Case Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Case Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="editCaseType">Case Type</Label>
                            <Select 
                              value={formData.caseType} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, caseType: value as any }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="personal_injury">Personal Injury</SelectItem>
                                <SelectItem value="auto_accident">Auto Accident</SelectItem>
                                <SelectItem value="workers_comp">Workers Compensation</SelectItem>
                                <SelectItem value="medical_malpractice">Medical Malpractice</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editIncidentDate">Incident Date</Label>
                            <Input
                              id="editIncidentDate"
                              type="date"
                              value={formData.incidentDate || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editAssignedAttorney">Assigned Attorney</Label>
                            <Input
                              id="editAssignedAttorney"
                              value={formData.assignedAttorney || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, assignedAttorney: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editStatus">Status</Label>
                            <Select 
                              value={formData.status} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="investigating">Investigating</SelectItem>
                                <SelectItem value="negotiating">Negotiating</SelectItem>
                                <SelectItem value="settled">Settled</SelectItem>
                                <SelectItem value="litigation">Litigation</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Insurance Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Insurance Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="editInsuranceCompany">Insurance Company</Label>
                            <Input
                              id="editInsuranceCompany"
                              value={formData.insuranceCompany || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editClaimNumber">Claim Number</Label>
                            <Input
                              id="editClaimNumber"
                              value={formData.claimNumber || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, claimNumber: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Financial Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Financial Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="editEstimatedValue">Estimated Value ($)</Label>
                            <Input
                              id="editEstimatedValue"
                              type="number"
                              value={formData.estimatedValue || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editSettlementGoal">Settlement Goal ($)</Label>
                            <Input
                              id="editSettlementGoal"
                              type="number"
                              value={formData.settlementGoal || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, settlementGoal: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Case Description */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Case Description</h3>
                        <Textarea
                          value={formData.description || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          placeholder="Enter case description..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsCaseEditDialogOpen(false)
                          setFormData(caseData || {})
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={async () => {
                          await handleSave()
                          setIsCaseEditDialogOpen(false)
                        }}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isDeadlineDialogOpen} onOpenChange={setIsDeadlineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Deadline
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Deadline</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="timelineDeadlineTitle">Title *</Label>
                        <Input
                          id="timelineDeadlineTitle"
                          placeholder="e.g., File motion, Discovery deadline, Settlement conference"
                          value={newDeadline.title}
                          onChange={(e) => setNewDeadline(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timelineDeadlineDescription">Description</Label>
                        <Textarea
                          id="timelineDeadlineDescription"
                          placeholder="Additional details about this deadline..."
                          value={newDeadline.description}
                          onChange={(e) => setNewDeadline(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="timelineDeadlineDueDate">Due Date *</Label>
                          <Input
                            id="timelineDeadlineDueDate"
                            type="datetime-local"
                            value={newDeadline.dueDate}
                            onChange={(e) => setNewDeadline(prev => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timelineDeadlinePriority">Priority</Label>
                          <Select 
                            value={newDeadline.priority} 
                            onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                              setNewDeadline(prev => ({ ...prev, priority: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timelineDeadlineType">Type</Label>
                        <Select 
                          value={newDeadline.type} 
                          onValueChange={(value: 'deadline' | 'milestone' | 'reminder') => 
                            setNewDeadline(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deadline">Legal Deadline</SelectItem>
                            <SelectItem value="milestone">Case Milestone</SelectItem>
                            <SelectItem value="reminder">Reminder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDeadlineDialogOpen(false)
                          setNewDeadline({
                            title: '',
                            description: '',
                            dueDate: '',
                            priority: 'medium',
                            type: 'deadline'
                          })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDeadline}>
                        Create Deadline
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Combined timeline with case events and deadlines */}
                {(() => {
                  // Create timeline items array
                  const timelineItems = [
                    {
                      type: 'case_event',
                      date: caseData.createdAt,
                      title: 'Case Created',
                      description: `Case ${caseData.caseNumber} created for ${caseData.clientName}`,
                      icon: 'create',
                      color: 'blue'
                    },
                    {
                      type: 'case_event',
                      date: caseData.createdAt,
                      title: 'Investigation Started',
                      description: 'Initial case review and document collection',
                      icon: 'investigate',
                      color: 'yellow'
                    },
                    {
                      type: 'case_event',
                      date: caseData.updatedAt,
                      title: 'Negotiation Phase',
                      description: 'Currently in active negotiation with insurance',
                      icon: 'negotiate',
                      color: 'orange'
                    },
                    // Add deadlines to timeline
                    ...deadlines.map(deadline => ({
                      type: 'deadline',
                      date: deadline.dueDate,
                      title: deadline.title,
                      description: deadline.description || `${deadline.type} - ${deadline.priority} priority`,
                      icon: deadline.type,
                      color: deadline.completed ? 'green' : (
                        new Date(deadline.dueDate) < new Date() ? 'red' : 
                        deadline.priority === 'urgent' ? 'red' :
                        deadline.priority === 'high' ? 'orange' : 'blue'
                      ),
                      deadline: deadline,
                      completed: deadline.completed,
                      overdue: new Date(deadline.dueDate) < new Date() && !deadline.completed
                    }))
                  ]

                  // Sort by date
                  const sortedItems = timelineItems.sort((a, b) => 
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  )

                  const getTimelineIcon = (icon: string) => {
                    switch (icon) {
                      case 'create': return <FileText className="h-4 w-4" />
                      case 'investigate': return <Eye className="h-4 w-4" />
                      case 'negotiate': return <MessageSquare className="h-4 w-4" />
                      case 'deadline': return <AlertTriangle className="h-4 w-4" />
                      case 'milestone': return <Target className="h-4 w-4" />
                      case 'reminder': return <Bell className="h-4 w-4" />
                      default: return <Clock className="h-4 w-4" />
                    }
                  }

                  const getTimelineColor = (color: string) => {
                    switch (color) {
                      case 'blue': return 'bg-blue-500'
                      case 'yellow': return 'bg-yellow-500'
                      case 'orange': return 'bg-orange-500'
                      case 'green': return 'bg-green-500'
                      case 'red': return 'bg-red-500'
                      case 'gray': return 'bg-gray-500'
                      default: return 'bg-blue-500'
                    }
                  }

                  return sortedItems.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getTimelineColor(item.color)} ${item.completed ? 'opacity-75' : ''}`}>
                          {getTimelineIcon(item.icon)}
                        </div>
                        {index < sortedItems.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>

                      {/* Timeline content */}
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : ''}`}>
                                {item.title}
                              </h4>
                              {item.type === 'deadline' && (
                                <>
                                  <Badge className={getDeadlineTypeColor(item.deadline?.type || 'deadline')}>
                                    {item.deadline?.type}
                                  </Badge>
                                  <Badge className={getPriorityColor(item.deadline?.priority || 'medium')}>
                                    {item.deadline?.priority}
                                  </Badge>
                                  {item.completed && (
                                    <Badge className="bg-green-100 text-green-800">
                                      Completed
                                    </Badge>
                                  )}
                                  {item.overdue && (
                                    <Badge className="bg-red-100 text-red-800">
                                      Overdue
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                            <p className={`text-sm mb-2 ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {item.type === 'deadline' ? 
                                  `Due: ${new Date(item.date).toLocaleString()}` :
                                  new Date(item.date).toLocaleDateString()
                                }
                              </div>
                              {item.type === 'deadline' && item.deadline?.createdAt && (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Created: {new Date(item.deadline.createdAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions for deadlines */}
                          {item.type === 'deadline' && (
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleDeadlineComplete(item.deadline?.id || '')}
                                className={item.completed ? 'text-green-600' : 'text-gray-600'}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteDeadline(item.deadline?.id || '')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                })()}

                {/* Empty state when no timeline items */}
                {deadlines.length === 0 && (
                  <div className="text-center py-8 mt-8 border-t">
                    <CalendarPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No deadlines in timeline yet</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Use the "Add Deadline" or "Edit Case" buttons above to create deadlines
                    </p>
                    <Button 
                      onClick={() => setIsDeadlineDialogOpen(true)} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Deadline
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negotiation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Negotiation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {caseData.currentOffer && caseData.settlementGoal && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Current Offer: ${caseData.currentOffer.toLocaleString()}</span>
                      <span>Goal: ${caseData.settlementGoal.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={(caseData.currentOffer / caseData.settlementGoal) * 100} 
                      className="h-3"
                    />
                  </div>
                )}
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No negotiation messages yet</p>
                  <Button className="mt-4">
                    Start AI Negotiation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}