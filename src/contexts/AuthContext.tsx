import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '../services/api'

interface User {
  id: string
  name: string
  email: string
  firm_name?: string
  phone?: string
  title?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    name: string
    email: string
    password: string
    firm_name?: string
    phone?: string
  }) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (profileData: Partial<User>) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuthStatus = async () => {
    try {
      const token = apiService.getToken()
      if (token) {
        const response = await apiService.getProfile()
        if (response.success && response.data) {
          setUser(response.data)
        } else {
          // Invalid token, clear it
          apiService.setToken(null)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      apiService.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password)
      if (response.success && response.data) {
        apiService.setToken(response.data.token)
        setUser(response.data.user)
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (userData: {
    name: string
    email: string
    password: string
    firm_name?: string
    phone?: string
  }) => {
    try {
      const response = await apiService.register(userData)
      if (response.success && response.data) {
        apiService.setToken(response.data.token)
        setUser(response.data.user)
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiService.setToken(null)
      setUser(null)
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(profileData)
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        throw new Error(response.error || 'Profile update failed')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext