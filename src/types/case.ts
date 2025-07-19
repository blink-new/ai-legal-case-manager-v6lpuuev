// Database schema interfaces (snake_case - matches actual DB structure)
export interface CaseDB {
  id: string
  case_number: string
  client_name: string
  client_email: string
  client_phone: string
  incident_date: string
  case_type: 'personal_injury' | 'auto_accident' | 'workers_comp' | 'medical_malpractice' | 'other'
  status: 'new' | 'investigating' | 'negotiating' | 'settled' | 'litigation' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  insurance_company: string
  claim_number?: string
  estimated_value: number
  current_offer?: number
  description: string
  assigned_attorney: string
  created_at: string
  updated_at: string
  user_id: string
  next_deadline?: string
  settlement_goal?: number
}

export interface DocumentDB {
  id: string
  case_id: string
  file_name: string
  file_type: string
  file_size: number
  uploaded_at: string
  category: 'medical' | 'police_report' | 'insurance' | 'correspondence' | 'evidence' | 'other'
  extracted_text?: string
  ai_analysis?: string
  public_url: string
  user_id: string
}

// Frontend interfaces (camelCase - for UI components)
export interface Case {
  id: string
  caseNumber: string
  clientName: string
  clientEmail: string
  clientPhone: string
  incidentDate: string
  caseType: 'personal_injury' | 'auto_accident' | 'workers_comp' | 'medical_malpractice' | 'other'
  status: 'new' | 'investigating' | 'negotiating' | 'settled' | 'litigation' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  insuranceCompany: string
  claimNumber?: string
  estimatedValue: number
  currentOffer?: number
  description: string
  assignedAttorney: string
  createdAt: string
  updatedAt: string
  userId: string
  nextDeadline?: string
  settlementGoal?: number
}

export interface Document {
  id: string
  caseId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  category: 'medical' | 'police_report' | 'insurance' | 'correspondence' | 'evidence' | 'other'
  extractedText?: string
  aiAnalysis?: string
  publicUrl: string
  userId: string
}

// Utility functions to convert between DB and frontend formats
export function dbCaseToCase(dbCase: CaseDB): Case {
  return {
    id: dbCase.id,
    caseNumber: dbCase.case_number,
    clientName: dbCase.client_name,
    clientEmail: dbCase.client_email,
    clientPhone: dbCase.client_phone,
    incidentDate: dbCase.incident_date,
    caseType: dbCase.case_type,
    status: dbCase.status,
    priority: dbCase.priority,
    insuranceCompany: dbCase.insurance_company,
    claimNumber: dbCase.claim_number,
    estimatedValue: dbCase.estimated_value,
    currentOffer: dbCase.current_offer,
    description: dbCase.description,
    assignedAttorney: dbCase.assigned_attorney,
    createdAt: dbCase.created_at,
    updatedAt: dbCase.updated_at,
    userId: dbCase.user_id,
    nextDeadline: dbCase.next_deadline,
    settlementGoal: dbCase.settlement_goal
  }
}

export function caseToCaseDB(case_: Partial<Case>): Partial<CaseDB> {
  return {
    id: case_.id,
    case_number: case_.caseNumber,
    client_name: case_.clientName,
    client_email: case_.clientEmail,
    client_phone: case_.clientPhone,
    incident_date: case_.incidentDate,
    case_type: case_.caseType,
    status: case_.status,
    priority: case_.priority,
    insurance_company: case_.insuranceCompany,
    claim_number: case_.claimNumber,
    estimated_value: case_.estimatedValue,
    current_offer: case_.currentOffer,
    description: case_.description,
    assigned_attorney: case_.assignedAttorney,
    created_at: case_.createdAt,
    updated_at: case_.updatedAt,
    user_id: case_.userId,
    next_deadline: case_.nextDeadline,
    settlement_goal: case_.settlementGoal
  }
}

export function dbDocumentToDocument(dbDoc: DocumentDB): Document {
  return {
    id: dbDoc.id,
    caseId: dbDoc.case_id,
    fileName: dbDoc.file_name,
    fileType: dbDoc.file_type,
    fileSize: dbDoc.file_size,
    uploadedAt: dbDoc.uploaded_at,
    category: dbDoc.category,
    extractedText: dbDoc.extracted_text,
    aiAnalysis: dbDoc.ai_analysis,
    publicUrl: dbDoc.public_url,
    userId: dbDoc.user_id
  }
}

export interface Negotiation {
  id: string
  caseId: string
  insuranceCompany: string
  currentOffer: number
  demandAmount: number
  status: 'pending' | 'countered' | 'accepted' | 'rejected'
  messages: NegotiationMessage[]
  createdAt: string
  updatedAt: string
  userId: string
}

export interface NegotiationMessage {
  id: string
  type: 'demand' | 'offer' | 'counter' | 'acceptance' | 'rejection'
  amount?: number
  message: string
  sender: 'attorney' | 'insurance'
  timestamp: string
  aiGenerated: boolean
}

export interface AIAnalysis {
  caseStrength: number // 1-10 scale
  recommendedSettlement: number
  keyFactors: string[]
  risks: string[]
  opportunities: string[]
  similarCases: string[]
  confidence: number
}