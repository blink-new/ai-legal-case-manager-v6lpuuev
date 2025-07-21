import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Upload,
  FileText,
  X,
  Loader2
} from 'lucide-react'
import { Case } from '@/types/case'
import { apiService } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface CaseListProps {
  onCaseSelect: (caseId: string) => void
}

export function CaseList({ onCaseSelect }: CaseListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    caseType: '',
    insuranceCompany: '',
    claimNumber: '',
    estimatedValue: '',
    incidentDate: '',
    description: '',
    priority: 'medium',
    assignedAttorney: ''
  })

  // Document upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploading, setUploading] = useState(false)

  const loadCases = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      setLoading(true)
      const response = await apiService.getCases()
      
      if (response.success && response.data) {
        setCases(response.data.cases || [])
      } else {
        setCases([])
      }
    } catch (error) {
      console.error('Error loading cases:', error)
      toast({
        title: "Info",
        description: "No cases found. Create your first case to get started.",
      })
      // Set empty array to show mock data
      setCases([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, toast])

  // Load cases when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadCases()
    }
  }, [isAuthenticated, loadCases])

  // Mock data for initial display if no cases exist
  const mockCases: Case[] = [
    {
      id: '1',
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
      description: 'Slip and fall accident at grocery store resulting in back injury',
      assignedAttorney: 'John Doe',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      userId: 'user123',
      nextDeadline: '2024-01-25',
      settlementGoal: 175000
    },
    {
      id: '2',
      caseNumber: 'AUTO-2024-015',
      clientName: 'Michael Chen',
      clientEmail: 'michael.chen@email.com',
      clientPhone: '(555) 987-6543',
      incidentDate: '2024-01-05',
      caseType: 'auto_accident',
      status: 'investigating',
      priority: 'medium',
      insuranceCompany: 'Allstate',
      estimatedValue: 85000,
      description: 'Rear-end collision on Highway 101, whiplash and property damage',
      assignedAttorney: 'Jane Smith',
      createdAt: '2024-01-08',
      updatedAt: '2024-01-18',
      userId: 'user123',
      nextDeadline: '2024-01-28'
    },
    {
      id: '3',
      caseNumber: 'WC-2024-008',
      clientName: 'Lisa Rodriguez',
      clientEmail: 'lisa.rodriguez@email.com',
      clientPhone: '(555) 456-7890',
      incidentDate: '2023-11-20',
      caseType: 'workers_comp',
      status: 'settled',
      priority: 'low',
      insuranceCompany: 'Liberty Mutual',
      estimatedValue: 45000,
      currentOffer: 45000,
      description: 'Workplace injury - repetitive strain injury from computer work',
      assignedAttorney: 'John Doe',
      createdAt: '2023-11-25',
      updatedAt: '2024-01-15',
      userId: 'user123'
    }
  ]

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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const generateCaseNumber = (caseType: string) => {
    const prefix = caseType.toUpperCase().replace('_', '-')
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${year}-${random}`
  }

  const handleCreateCase = async () => {
    if (!user) return
    
    if (!formData.clientName || !formData.clientEmail || !formData.caseType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setCreating(true)
    setUploading(true)

    try {
      // Generate case number
      const caseNumber = generateCaseNumber(formData.caseType)
      
      // Create case via API
      const response = await apiService.createCase({
        caseNumber: caseNumber,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        caseType: formData.caseType,
        status: 'new',
        priority: formData.priority,
        insuranceCompany: formData.insuranceCompany,
        claimNumber: formData.claimNumber,
        estimatedValue: parseInt(formData.estimatedValue) || 0,
        incidentDate: formData.incidentDate,
        description: formData.description,
        assignedAttorney: formData.assignedAttorney || user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to create case')
      }

      const newCase = response.data

      // Upload documents if any
      if (uploadedFiles.length > 0) {
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i]
          
          try {
            setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
            
            const uploadResponse = await apiService.uploadDocument(file, newCase.id)

            if (uploadResponse.success) {
              setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
            } else {
              throw new Error(uploadResponse.error || 'Upload failed')
            }
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error)
            toast({
              title: "Upload Error",
              description: `Failed to upload ${file.name}`,
              variant: "destructive"
            })
          }
        }
      }

      // Reset form and close dialog
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        caseType: '',
        insuranceCompany: '',
        claimNumber: '',
        estimatedValue: '',
        incidentDate: '',
        description: '',
        priority: 'medium',
        assignedAttorney: ''
      })
      setUploadedFiles([])
      setUploadProgress({})
      setIsNewCaseOpen(false)

      // Reload cases
      await loadCases()

      toast({
        title: "Success",
        description: "Case created successfully",
      })

    } catch (error) {
      console.error('Error creating case:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create case",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
      setUploading(false)
    }
  }

  const displayCases = cases.length > 0 ? cases : mockCases

  const filteredCases = displayCases.filter(case_ => {
    // Add null checks to prevent undefined errors
    const clientName = case_.clientName || ''
    const caseNumber = case_.caseNumber || ''
    
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || case_.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage and track all your legal cases</p>
        </div>
        <Dialog open={isNewCaseOpen} onOpenChange={setIsNewCaseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input 
                      id="clientName" 
                      placeholder="Enter client name"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client Email *</Label>
                    <Input 
                      id="clientEmail" 
                      type="email" 
                      placeholder="client@email.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Client Phone</Label>
                    <Input 
                      id="clientPhone" 
                      placeholder="(555) 123-4567"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incidentDate">Incident Date</Label>
                    <Input 
                      id="incidentDate" 
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Case Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Case Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="caseType">Case Type *</Label>
                    <Select value={formData.caseType} onValueChange={(value) => setFormData(prev => ({ ...prev, caseType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select case type" />
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
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceCompany">Insurance Company</Label>
                    <Input 
                      id="insuranceCompany" 
                      placeholder="Enter insurance company"
                      value={formData.insuranceCompany}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claimNumber">Claim Number</Label>
                    <Input 
                      id="claimNumber" 
                      placeholder="Enter claim number"
                      value={formData.claimNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, claimNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                    <Input 
                      id="estimatedValue" 
                      type="number" 
                      placeholder="0"
                      value={formData.estimatedValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedAttorney">Assigned Attorney</Label>
                    <Input 
                      id="assignedAttorney" 
                      placeholder="Enter attorney name"
                      value={formData.assignedAttorney}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedAttorney: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="description">Case Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the case details..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <h3 className="text-lg font-medium mb-4">Documents</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Upload case documents (medical records, police reports, correspondence, etc.)
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Files
                      </Button>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {uploadProgress[file.name] !== undefined && (
                                <div className="w-20">
                                  <Progress value={uploadProgress[file.name]} className="h-2" />
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(index)}
                                disabled={uploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsNewCaseOpen(false)
                  setUploadedFiles([])
                  setUploadProgress({})
                  setFormData({
                    clientName: '',
                    clientEmail: '',
                    clientPhone: '',
                    caseType: '',
                    insuranceCompany: '',
                    claimNumber: '',
                    estimatedValue: '',
                    incidentDate: '',
                    description: '',
                    priority: 'medium',
                    assignedAttorney: ''
                  })
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateCase}
                disabled={creating || !formData.clientName || !formData.clientEmail || !formData.caseType}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Case'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 md:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1 md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="litigation">Litigation</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="flex-1 md:w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Cases ({filteredCases.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {/* Desktop Table - Hidden on Mobile */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Next Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((case_) => (
                  <TableRow key={case_.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{case_.caseNumber || 'Unknown'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{case_.clientName || 'Unknown Client'}</div>
                        <div className="text-sm text-gray-500">{case_.clientEmail || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {(case_.caseType || 'other').replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(case_.status || 'new')}>
                        {case_.status || 'new'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(case_.priority || 'medium')}>
                        {case_.priority || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>{case_.insuranceCompany || 'Not specified'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        {(case_.estimatedValue || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {case_.nextDeadline ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {new Date(case_.nextDeadline).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCaseSelect(case_.id)}
                          title="View Case Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onCaseSelect(case_.id)}
                          title="Edit Case"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout - Visible on Mobile */}
          <div className="lg:hidden space-y-3">
            {filteredCases.map((case_) => (
              <div 
                key={case_.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onCaseSelect(case_.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">
                        {case_.caseNumber || 'Unknown'}
                      </span>
                      <Badge className={`${getStatusColor(case_.status || 'new')} text-xs`}>
                        {case_.status || 'new'}
                      </Badge>
                      <Badge className={`${getPriorityColor(case_.priority || 'medium')} text-xs`}>
                        {case_.priority || 'medium'}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {case_.clientName || 'Unknown Client'}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {case_.clientEmail || 'No email'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="flex items-center text-sm font-medium text-gray-900 mb-1">
                      <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                      {(case_.estimatedValue || 0) >= 1000000 
                        ? `${((case_.estimatedValue || 0) / 1000000).toFixed(1)}M`
                        : (case_.estimatedValue || 0) >= 1000
                        ? `${((case_.estimatedValue || 0) / 1000).toFixed(0)}K`
                        : `${(case_.estimatedValue || 0).toLocaleString()}`
                      }
                    </div>
                    {case_.nextDeadline && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                        {new Date(case_.nextDeadline).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="capitalize">
                      {(case_.caseType || 'other').replace('_', ' ')}
                    </span>
                    {case_.insuranceCompany && (
                      <span>{case_.insuranceCompany}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCaseSelect(case_.id)
                      }}
                      className="text-xs px-2 py-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredCases.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">No cases found</div>
                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}