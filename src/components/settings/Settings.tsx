import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  Upload,
  Key,
  Globe,
  Clock,
  DollarSign
} from 'lucide-react'


import { useToast } from '../../hooks/use-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  title: string
  firm_name: string
  address: string
  avatar_url?: string
  created_at: string
}

interface FirmSettings {
  id: string
  firm_name: string
  address: string
  phone: string
  email: string
  website: string
  logo_url?: string
  billing_rate: number
  currency: string
  timezone: string
  created_at: string
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [firmSettings, setFirmSettings] = useState<FirmSettings | null>(null)
  const { toast } = useToast()

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    case_updates: true,
    deadline_reminders: true,
    client_messages: true,
    settlement_alerts: true
  })

  // Security settings
  const [security, setSecurity] = useState({
    two_factor_enabled: false,
    session_timeout: '30',
    password_expiry: '90'
  })

  // Theme settings
  const [theme, setTheme] = useState({
    mode: 'light',
    accent_color: '#1e40af',
    sidebar_collapsed: false
  })

  const loadUserData = async () => {
    try {
      const userData = await blink.auth.me()
      setUser(userData)
      
      // Load user profile
      const profiles = await blink.db.userProfiles.list({
        where: { userId: userData.id },
        limit: 1
      })
      
      if (profiles.length > 0) {
        setProfile(profiles[0])
      } else {
        // Create default profile
        const newProfile = await blink.db.userProfiles.create({
          id: `profile_${Date.now()}`,
          userId: userData.id,
          name: userData.displayName || userData.email,
          email: userData.email,
          phone: '',
          title: 'Attorney',
          firmName: 'Law Firm',
          address: '',
          createdAt: new Date().toISOString()
        })
        setProfile(newProfile)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadSettings = async () => {
    try {
      // Load firm settings
      const firms = await blink.db.firmSettings.list({ limit: 1 })
      if (firms.length > 0) {
        setFirmSettings(firms[0])
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  useEffect(() => {
    loadUserData()
    loadSettings()
  }, [])

  const saveProfile = async () => {
    if (!profile || !user) return
    
    setLoading(true)
    try {
      await blink.db.userProfiles.update(profile.id, {
        name: profile.name,
        phone: profile.phone,
        title: profile.title,
        firmName: profile.firmName,
        address: profile.address
      })
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveFirmSettings = async () => {
    if (!firmSettings) return
    
    setLoading(true)
    try {
      if (firmSettings.id) {
        await blink.db.firmSettings.update(firmSettings.id, firmSettings)
      } else {
        const newSettings = await blink.db.firmSettings.create({
          id: `firm_${Date.now()}`,
          ...firmSettings,
          createdAt: new Date().toISOString()
        })
        setFirmSettings(newSettings)
      }
      
      toast({
        title: "Settings Saved",
        description: "Firm settings have been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    try {
      setLoading(true)
      const { publicUrl } = await blink.storage.upload(
        file,
        `avatars/${user.id}/${file.name}`,
        { upsert: true }
      )
      
      const updatedProfile = { ...profile, avatarUrl: publicUrl }
      setProfile(updatedProfile)
      
      await blink.db.userProfiles.update(profile.id, { avatarUrl: publicUrl })
      
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="firm" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Firm</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and professional details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="text-lg">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Change Avatar
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input
                    id="title"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={saveProfile} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Firm Settings</CardTitle>
              <CardDescription>
                Configure your law firm's information and billing settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firm-name">Firm Name</Label>
                  <Input
                    id="firm-name"
                    value={firmSettings?.firmName || ''}
                    onChange={(e) => setFirmSettings(prev => prev ? { ...prev, firmName: e.target.value } : {
                      id: '',
                      firmName: e.target.value,
                      address: '',
                      phone: '',
                      email: '',
                      website: '',
                      billingRate: 0,
                      currency: 'USD',
                      timezone: 'UTC',
                      createdAt: ''
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firm-website">Website</Label>
                  <Input
                    id="firm-website"
                    value={firmSettings?.website || ''}
                    onChange={(e) => setFirmSettings(prev => prev ? { ...prev, website: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firm-email">Firm Email</Label>
                  <Input
                    id="firm-email"
                    type="email"
                    value={firmSettings?.email || ''}
                    onChange={(e) => setFirmSettings(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firm-phone">Firm Phone</Label>
                  <Input
                    id="firm-phone"
                    value={firmSettings?.phone || ''}
                    onChange={(e) => setFirmSettings(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firm-address">Firm Address</Label>
                <Textarea
                  id="firm-address"
                  value={firmSettings?.address || ''}
                  onChange={(e) => setFirmSettings(prev => prev ? { ...prev, address: e.target.value } : null)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing-rate">Hourly Rate</Label>
                  <Input
                    id="billing-rate"
                    type="number"
                    value={firmSettings?.billingRate || 0}
                    onChange={(e) => setFirmSettings(prev => prev ? { ...prev, billingRate: Number(e.target.value) } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={firmSettings?.currency || 'USD'}
                    onValueChange={(value) => setFirmSettings(prev => prev ? { ...prev, currency: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={firmSettings?.timezone || 'UTC'}
                    onValueChange={(value) => setFirmSettings(prev => prev ? { ...prev, timezone: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={saveFirmSettings} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Firm Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about important events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email_notifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, push_notifications: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Case Updates</Label>
                    <p className="text-sm text-gray-500">Notify when case status changes</p>
                  </div>
                  <Switch
                    checked={notifications.case_updates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, case_updates: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Deadline Reminders</Label>
                    <p className="text-sm text-gray-500">Remind about upcoming deadlines</p>
                  </div>
                  <Switch
                    checked={notifications.deadline_reminders}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, deadline_reminders: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Client Messages</Label>
                    <p className="text-sm text-gray-500">Notify when clients send messages</p>
                  </div>
                  <Switch
                    checked={notifications.client_messages}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, client_messages: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Settlement Alerts</Label>
                    <p className="text-sm text-gray-500">Notify about settlement opportunities</p>
                  </div>
                  <Switch
                    checked={notifications.settlement_alerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, settlement_alerts: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and access controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={security.two_factor_enabled ? "default" : "secondary"}>
                    {security.two_factor_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={security.two_factor_enabled}
                    onCheckedChange={(checked) => 
                      setSecurity(prev => ({ ...prev, two_factor_enabled: checked }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Select
                    value={security.session_timeout}
                    onValueChange={(value) => setSecurity(prev => ({ ...prev, session_timeout: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                  <Select
                    value={security.password_expiry}
                    onValueChange={(value) => setSecurity(prev => ({ ...prev, password_expiry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Download My Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme Mode</Label>
                  <Select
                    value={theme.mode}
                    onValueChange={(value) => setTheme(prev => ({ ...prev, mode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex space-x-2">
                    {['#1e40af', '#dc2626', '#059669', '#7c3aed', '#ea580c'].map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          theme.accent_color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setTheme(prev => ({ ...prev, accent_color: color }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Collapsed Sidebar</Label>
                    <p className="text-sm text-gray-500">Start with sidebar collapsed</p>
                  </div>
                  <Switch
                    checked={theme.sidebar_collapsed}
                    onCheckedChange={(checked) => 
                      setTheme(prev => ({ ...prev, sidebar_collapsed: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}