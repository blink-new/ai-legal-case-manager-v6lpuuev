import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building, Users, Settings as SettingsIcon, CreditCard, Shield, Globe, Mail, Phone, MapPin, Calendar, DollarSign } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface Company {
  id: string
  companyName: string
  legalName: string
  taxId: string
  registrationNumber: string
  companyType: string
  industry: string
  foundedYear: number
  employeeCount: string
  annualRevenue: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  email: string
  website: string
  logoUrl: string | null
  description: string
  specializations: string
  certifications: string
  billingRate: number
  currency: string
  timezone: string
  subscriptionPlan: string
  subscriptionStatus: string
  trialEndsAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface CompanyMember {
  id: string
  companyId: string
  userId: string
  role: string
  title: string
  department: string
  permissions: string
  status: string
  joinedAt: string
  userProfile?: {
    name: string
    email: string
    avatarUrl: string | null
  }
}

export function CompanySettings() {
  const [company, setCompany] = useState<Company | null>(null)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  const loadCompanyData = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      
      // Get user's company membership
      const memberships = await blink.db.companyMembers.list({
        where: { userId: userId },
        limit: 1
      })
      
      if (memberships.length === 0) {
        setLoading(false)
        return
      }
      
      const membership = memberships[0]
      
      // Get company details
      const companies = await blink.db.companies.list({
        where: { id: membership.companyId },
        limit: 1
      })
      
      if (companies.length > 0) {
        setCompany(companies[0])
        
        // Get all company members
        const allMembers = await blink.db.companyMembers.list({
          where: { companyId: companies[0].id }
        })
        
        // Get user profiles for members
        const membersWithProfiles = await Promise.all(
          allMembers.map(async (member) => {
            const profiles = await blink.db.userProfiles.list({
              where: { userId: member.userId },
              limit: 1
            })
            return {
              ...member,
              userProfile: profiles[0] || null
            }
          })
        )
        
        setMembers(membersWithProfiles)
      }
    } catch (error) {
      console.error('Error loading company data:', error)
      toast({
        title: "Error",
        description: "Failed to load company information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && !state.isLoading) {
        loadCompanyData(state.user.id)
      }
    })
    return unsubscribe
  }, [loadCompanyData])

  const updateCompany = async (updates: Partial<Company>) => {
    if (!company) return
    
    try {
      setSaving(true)
      
      await blink.db.companies.update(company.id, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      
      setCompany(prev => prev ? { ...prev, ...updates } : null)
      
      toast({
        title: "Success",
        description: "Company information updated successfully"
      })
    } catch (error) {
      console.error('Error updating company:', error)
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    
    const formData = new FormData(e.target as HTMLFormElement)
    const updates = {
      companyName: formData.get('companyName') as string,
      legalName: formData.get('legalName') as string,
      taxId: formData.get('taxId') as string,
      companyType: formData.get('companyType') as string,
      description: formData.get('description') as string,
      website: formData.get('website') as string
    }
    
    updateCompany(updates)
  }

  const handleContactInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    
    const formData = new FormData(e.target as HTMLFormElement)
    const updates = {
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zipCode: formData.get('zipCode') as string,
      country: formData.get('country') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string
    }
    
    updateCompany(updates)
  }

  const handleBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    
    const formData = new FormData(e.target as HTMLFormElement)
    const updates = {
      billingRate: parseFloat(formData.get('billingRate') as string) || 0,
      currency: formData.get('currency') as string,
      timezone: formData.get('timezone') as string
    }
    
    updateCompany(updates)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Company Found</h3>
          <p className="text-gray-600">You don't seem to be associated with any company yet.</p>
        </CardContent>
      </Card>
    )
  }

  const specializations = company.specializations ? JSON.parse(company.specializations) : []
  const certifications = company.certifications ? JSON.parse(company.certifications) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600">Manage your company information and settings</p>
        </div>
        <Badge variant={company.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
          {company.subscriptionPlan} Plan
        </Badge>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      defaultValue={company.companyName}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      name="legalName"
                      defaultValue={company.legalName}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input
                      id="taxId"
                      name="taxId"
                      defaultValue={company.taxId}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyType">Company Type</Label>
                    <Select name="companyType" defaultValue={company.companyType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Solo Practice">Solo Practice</SelectItem>
                        <SelectItem value="Small Law Firm (2-10 attorneys)">Small Law Firm (2-10 attorneys)</SelectItem>
                        <SelectItem value="Medium Law Firm (11-50 attorneys)">Medium Law Firm (11-50 attorneys)</SelectItem>
                        <SelectItem value="Large Law Firm (51+ attorneys)">Large Law Firm (51+ attorneys)</SelectItem>
                        <SelectItem value="Corporate Legal Department">Corporate Legal Department</SelectItem>
                        <SelectItem value="Government Agency">Government Agency</SelectItem>
                        <SelectItem value="Non-Profit Legal Aid">Non-Profit Legal Aid</SelectItem>
                        <SelectItem value="Legal Consulting">Legal Consulting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      defaultValue={company.website}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Founded</Label>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{company.foundedYear}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={company.description}
                    rows={3}
                  />
                </div>
                
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactInfoSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={company.address}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={company.city}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      defaultValue={company.state}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      defaultValue={company.zipCode}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={company.country}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={company.phone}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={company.email}
                  />
                </div>
                
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Practice Areas & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Practice Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((area: string, index: number) => (
                    <Badge key={index} variant="secondary">{area}</Badge>
                  ))}
                  {specializations.length === 0 && (
                    <p className="text-gray-500 text-sm">No practice areas specified</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Certifications & Awards</h4>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert: string, index: number) => (
                    <Badge key={index} variant="outline">{cert}</Badge>
                  ))}
                  {certifications.length === 0 && (
                    <p className="text-gray-500 text-sm">No certifications specified</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee Count</Label>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{company.employeeCount}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Annual Revenue</Label>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>{company.annualRevenue}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {member.userProfile?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.userProfile?.name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-600">{member.userProfile?.email}</p>
                        <p className="text-sm text-gray-500">{member.title} • {member.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Billing & Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBillingSubmit} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Current Plan</h4>
                      <p className="text-blue-700">{company.subscriptionPlan} Plan</p>
                    </div>
                    <Badge variant={company.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                      {company.subscriptionStatus}
                    </Badge>
                  </div>
                  {company.trialEndsAt && (
                    <p className="text-sm text-blue-600 mt-2">
                      Trial ends: {new Date(company.trialEndsAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-4">Billing Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingRate">Standard Billing Rate ($/hour)</Label>
                      <Input
                        id="billingRate"
                        name="billingRate"
                        type="number"
                        step="0.01"
                        defaultValue={company.billingRate}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select name="currency" defaultValue={company.currency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        name="timezone"
                        defaultValue={company.timezone}
                      />
                    </div>
                  </div>
                </div>
                
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Billing Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}