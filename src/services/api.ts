// Custom API service for independent backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com/api'  // Replace with your production backend URL
  : 'http://localhost:5000/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiService {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication methods
  async register(userData: {
    name: string
    email: string
    password: string
    firm_name?: string
    phone?: string
  }) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    })
    this.setToken(null)
    return response
  }

  async getProfile() {
    return this.request<any>('/auth/profile')
  }

  async updateProfile(profileData: any) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  // Cases methods
  async getCases(params?: { status?: string; client?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const endpoint = `/cases${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<{ cases: any[]; total: number; page: number; totalPages: number }>(endpoint)
  }

  async getCase(id: string) {
    return this.request<any>(`/cases/${id}`)
  }

  async createCase(caseData: any) {
    return this.request<any>('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    })
  }

  async updateCase(id: string, caseData: any) {
    return this.request<any>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caseData),
    })
  }

  async deleteCase(id: string) {
    return this.request(`/cases/${id}`, {
      method: 'DELETE',
    })
  }

  async getCaseStats() {
    return this.request<{
      total: number
      active: number
      settled: number
      pending: number
      totalValue: number
      avgSettlement: number
    }>('/cases/stats')
  }

  // Documents methods
  async uploadDocument(file: File, caseId?: string) {
    const formData = new FormData()
    formData.append('document', file)
    if (caseId) {
      formData.append('case_id', caseId)
    }

    const headers: HeadersInit = {}
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getDocuments(caseId?: string) {
    const endpoint = caseId ? `/documents?case_id=${caseId}` : '/documents'
    return this.request<any[]>(endpoint)
  }

  async deleteDocument(id: string) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE',
    })
  }

  async downloadDocument(id: string) {
    const headers: HeadersInit = {}
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    return response.blob()
  }

  // User management methods
  async getDashboardStats() {
    return this.request<{
      totalCases: number
      activeCases: number
      settledCases: number
      pendingCases: number
      totalValue: number
      avgSettlement: number
      recentActivity: any[]
      upcomingDeadlines: any[]
    }>('/users/dashboard')
  }

  async getActivity(limit = 10) {
    return this.request<any[]>(`/users/activity?limit=${limit}`)
  }
}

export const apiService = new ApiService()
export default apiService