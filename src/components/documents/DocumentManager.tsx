import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, Image, Download, Eye, Trash2, Search, Filter, Plus, Brain, FileCheck } from 'lucide-react'


import { useToast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'

interface Document {
  id: string
  case_id?: string
  caseId?: string
  file_name?: string
  fileName?: string
  file_type?: string
  fileType?: string
  file_size?: number
  fileSize?: number
  uploaded_at?: string
  uploadedAt?: string
  category: string
  ai_analysis?: string
  aiAnalysis?: string
  extracted_text?: string
  extractedText?: string
  public_url?: string
  publicUrl?: string
  user_id?: string
  userId?: string
}

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedCase, setSelectedCase] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('other')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [cases, setCases] = useState<any[]>([])
  const { toast } = useToast()

  const loadDocuments = async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.documents.list({
        where: { user_id: user.id },
        orderBy: { uploaded_at: 'desc' }
      })
      
      // Filter out any null/undefined documents and ensure they have required properties
      const validDocuments = (result || []).filter(doc => 
        doc && 
        typeof doc === 'object' && 
        doc.id &&
        (doc.file_name || doc.fileName)
      )
      
      setDocuments(validDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
      toast({
        title: "Info",
        description: "No documents found. Upload your first document to get started.",
      })
      setDocuments([]) // Set empty array to prevent filter errors
    } finally {
      setLoading(false)
    }
  }

  const loadCases = async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.cases.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setCases(result || [])
    } catch (error) {
      console.error('Error loading cases:', error)
    }
  }

  useEffect(() => {
    loadDocuments()
    loadCases()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    for (const file of files) {
      try {
        // Upload to storage
        const { publicUrl } = await blink.storage.upload(
          file,
          `documents/${Date.now()}-${file.name}`,
          { upsert: true }
        )

        // Extract text content
        const extractedText = await blink.data.extractFromBlob(file)

        // Generate AI summary
        const { text: aiSummary } = await blink.ai.generateText({
          prompt: `Analyze this legal document and provide a concise summary including key points, parties involved, and important dates:\n\n${extractedText.substring(0, 2000)}`,
          maxTokens: 200
        })

        // Save to database
        await blink.db.documents.create({
          case_id: selectedCase,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
          category: selectedCategory,
          ai_analysis: aiSummary,
          extracted_text: extractedText,
          public_url: publicUrl,
          user_id: (await blink.auth.me()).id
        })

        toast({
          title: "Success",
          description: `${file.name} uploaded and analyzed successfully`
        })

        loadDocuments()
      } catch (error) {
        console.error('Error uploading file:', error)
        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        })
      }
    }
  }

  const analyzeDocument = async (docId: string) => {
    try {
      const doc = documents.find(d => d.id === docId)
      if (!doc) return

      // Handle both snake_case and camelCase property names
      const extractedText = doc.extracted_text || doc.extractedText
      if (!extractedText) {
        toast({
          title: "No Text Content",
          description: "This document has no extracted text to analyze",
          variant: "destructive"
        })
        return
      }

      const { text: analysis } = await blink.ai.generateText({
        prompt: `Perform a detailed legal analysis of this document. Identify key legal issues, potential risks, important clauses, and actionable insights:\\n\\n${extractedText.substring(0, 3000)}`,
        maxTokens: 500
      })

      await blink.db.documents.update(docId, {
        ai_analysis: analysis
      })

      toast({
        title: "Analysis Complete",
        description: "Document has been analyzed by AI"
      })

      loadDocuments()
    } catch (error) {
      console.error('Error analyzing document:', error)
      toast({
        title: "Error",
        description: "Failed to analyze document",
        variant: "destructive"
      })
    }
  }

  const filteredDocuments = documents.filter(doc => {
    // Add null/undefined checks to prevent runtime errors
    if (!doc || typeof doc !== 'object') return false
    
    // Ensure required properties exist
    const fileName = doc.file_name || doc.fileName || ''
    const category = doc.category || 'other'
    const aiAnalysis = doc.ai_analysis || doc.aiAnalysis || ''
    
    const matchesSearch = fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aiAnalysis.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || category === filterCategory
    return matchesSearch && matchesCategory
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical': return 'bg-red-100 text-red-800'
      case 'police_report': return 'bg-blue-100 text-blue-800'
      case 'insurance': return 'bg-green-100 text-green-800'
      case 'correspondence': return 'bg-purple-100 text-purple-800'
      case 'evidence': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading documents...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Upload, analyze, and manage case documents with AI</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload documents to be automatically processed and analyzed by AI
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="case-select">Select Case</Label>
                <Select value={selectedCase} onValueChange={setSelectedCase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((case_) => (
                      <SelectItem key={case_.id} value={case_.id}>
                        {case_.client_name} - {case_.case_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category-select">Document Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical">Medical Records</SelectItem>
                    <SelectItem value="police_report">Police Report</SelectItem>
                    <SelectItem value="insurance">Insurance Documents</SelectItem>
                    <SelectItem value="correspondence">Correspondence</SelectItem>
                    <SelectItem value="evidence">Evidence</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file-upload">Documents</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={!selectedCase}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported: PDF, DOC, DOCX, TXT, JPG, PNG
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="medical">Medical Records</SelectItem>
            <SelectItem value="police_report">Police Reports</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="correspondence">Correspondence</SelectItem>
            <SelectItem value="evidence">Evidence</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              // Safely access properties with fallbacks
              const fileName = doc.file_name || doc.fileName || 'Unknown File'
              const fileType = doc.file_type || doc.fileType || 'application/octet-stream'
              const fileSize = doc.file_size || doc.fileSize || 0
              const uploadedAt = doc.uploaded_at || doc.uploadedAt || new Date().toISOString()
              const category = doc.category || 'other'
              const aiAnalysis = doc.ai_analysis || doc.aiAnalysis
              const publicUrl = doc.public_url || doc.publicUrl
              
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(fileType)}
                        <CardTitle className="text-sm font-medium truncate">
                          {fileName}
                        </CardTitle>
                      </div>
                      <Badge className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Size: {formatFileSize(fileSize)}</div>
                      <div>Uploaded: {new Date(uploadedAt).toLocaleDateString()}</div>
                    </div>
                    
                    {aiAnalysis && (
                      <div className="text-sm text-gray-700 line-clamp-3">
                        {aiAnalysis}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      {publicUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => analyzeDocument(doc.id)}
                      >
                        <Brain className="h-3 w-3 mr-1" />
                        Analyze
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredDocuments.map((doc) => {
                  // Safely access properties with fallbacks
                  const fileName = doc.file_name || doc.fileName || 'Unknown File'
                  const fileType = doc.file_type || doc.fileType || 'application/octet-stream'
                  const fileSize = doc.file_size || doc.fileSize || 0
                  const uploadedAt = doc.uploaded_at || doc.uploadedAt || new Date().toISOString()
                  const category = doc.category || 'other'
                  const aiAnalysis = doc.ai_analysis || doc.aiAnalysis
                  const publicUrl = doc.public_url || doc.publicUrl
                  
                  return (
                    <div key={doc.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(fileType)}
                          <div>
                            <div className="font-medium">{fileName}</div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(fileSize)} • {new Date(uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(category)}>
                            {category}
                          </Badge>
                          {publicUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => analyzeDocument(doc.id)}
                          >
                            <Brain className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {aiAnalysis && (
                        <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {aiAnalysis}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload your first document to get started'
              }
            </p>
            {!searchTerm && filterCategory === 'all' && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}