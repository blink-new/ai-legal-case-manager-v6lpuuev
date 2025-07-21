import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '../services/api'

interface User {
  id: string
  email: string
  displayName?: string
  firstName?: string
  lastName?: string
  firmName?: string
  phone?: string
  role?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    firmName?: string
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

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await apiService.login(email, password)
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        apiService.setToken(token)
        setUser(userData)
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    firmName?: string
    phone?: string
  }) => {
    try {
      setLoading(true)
      const response = await apiService.register(userData)
      
      if (response.success && response.data) {
        const { user: newUser, token } = response.data
        apiService.setToken(token)
        setUser(newUser)
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if API call fails
      setUser(null)
      apiService.setToken(null)
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(profileData)
      
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        throw new Error(response.error || 'Profile update failed')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiService.getToken()
        if (token) {
          const response = await apiService.getProfile()
          if (response.success && response.data) {
            setUser(response.data.user)
          } else {
            // Token is invalid, clear it
            apiService.setToken(null)
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // Clear invalid token
        apiService.setToken(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

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