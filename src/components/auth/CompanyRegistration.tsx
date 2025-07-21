import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Scale, Building, User, Mail, Phone, MapPin, Briefcase, Globe, DollarSign, Users, FileText, Award } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface CompanyRegistrationProps {
  user: any
  onComplete: () => void
}

interface CompanyFormData {
  // Company Information
  companyName: string
  legalName: string
  companyType: string
  taxId: string
  registrationNumber: string
  foundedYear: string
  employeeCount: string
  annualRevenue: string
  description: string
  
  // Contact Information
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  email: string
  website: string
  
  // Legal Practice Information
  specializations: string[]
  certifications: string[]
  billingRate: string
  currency: string
  timezone: string
  
  // Personal Information
  userTitle: string
  userPhone: string
  userBio: string
  linkedinUrl: string
  barNumber: string
  licenseState: string
  yearsExperience: string
  hourlyRate: string
  
  // Subscription
  subscriptionPlan: string
}

const practiceAreas = [
  'Personal Injury',
  'Corporate Law',
  'Criminal Defense',
  'Family Law',
  'Real Estate',
  'Employment Law',
  'Immigration',
  'Intellectual Property',
  'Tax Law',
  'Estate Planning',
  'Bankruptcy',
  'Environmental Law',
  'Healthcare Law',
  'Securities Law',
  'Litigation',
  'Contract Law',
  'Insurance Law',
  'Civil Rights',
  'Entertainment Law',
  'International Law'
]

const certifications = [
  'Board Certified Specialist',
  'ABA Certification',
  'State Bar Certification',
  'Martindale-Hubbell AV Rating',
  'Super Lawyers',
  'Best Lawyers',
  'ISO 27001 Certified',
  'CIPP/US Certification',
  'CPA License',
  'Notary Public'
]

const companyTypes = [
  'Solo Practice',
  'Small Law Firm (2-10 attorneys)',
  'Medium Law Firm (11-50 attorneys)',
  'Large Law Firm (51+ attorneys)',
  'Corporate Legal Department',
  'Government Agency',
  'Non-Profit Legal Aid',
  'Legal Consulting'
]

const employeeCounts = [
  '1 (Solo)',
  '2-5',
  '6-10',
  '11-25',
  '26-50',
  '51-100',
  '101-250',
  '250+'
]

const revenueRanges = [
  'Under $100K',
  '$100K - $500K',
  '$500K - $1M',
  '$1M - $5M',
  '$5M - $10M',
  '$10M - $50M',
  '$50M+'
]

const subscriptionPlans = [
  { value: 'trial', label: 'Free Trial (30 days)', price: '$0' },
  { value: 'starter', label: 'Starter Plan', price: '$49/month' },
  { value: 'professional', label: 'Professional Plan', price: '$99/month' },
  { value: 'enterprise', label: 'Enterprise Plan', price: '$199/month' }
]

export function CompanyRegistration({ user, onComplete }: CompanyRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<CompanyFormData>({
    // Company Information
    companyName: '',
    legalName: '',
    companyType: 'Solo Practice',
    taxId: '',
    registrationNumber: '',
    foundedYear: new Date().getFullYear().toString(),
    employeeCount: '1 (Solo)',
    annualRevenue: 'Under $100K',
    description: '',
    
    // Contact Information
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    email: user?.email || '',
    website: '',
    
    // Legal Practice Information
    specializations: [],
    certifications: [],
    billingRate: '250',
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Personal Information
    userTitle: 'Attorney',
    userPhone: '',
    userBio: '',
    linkedinUrl: '',
    barNumber: '',
    licenseState: '',
    yearsExperience: '1',
    hourlyRate: '250',
    
    // Subscription
    subscriptionPlan: 'trial'
  })

  const updateFormData = (field: keyof CompanyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      updateFormData('specializations', [...formData.specializations, specialization])
    } else {
      updateFormData('specializations', formData.specializations.filter(s => s !== specialization))
    }
  }

  const handleCertificationChange = (certification: string, checked: boolean) => {
    if (checked) {
      updateFormData('certifications', [...formData.certifications, certification])
    } else {
      updateFormData('certifications', formData.certifications.filter(c => c !== certification))
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.companyName && formData.companyType && formData.email)
      case 2:
        return !!(formData.address && formData.city && formData.state && formData.zipCode)
      case 3:
        return formData.specializations.length > 0
      case 4:
        return !!(formData.userTitle && formData.yearsExperience)
      case 5:
        return !!formData.subscriptionPlan
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      })
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast({
        title: "Incomplete Information",
        description: "Please complete all required fields.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const companyId = `company_${Date.now()}`
      const profileId = `profile_${Date.now()}`
      const membershipId = `member_${Date.now()}`
      
      // Create company
      await blink.db.companies.create({
        id: companyId,
        companyName: formData.companyName,
        legalName: formData.legalName || formData.companyName,
        taxId: formData.taxId,
        registrationNumber: formData.registrationNumber,
        companyType: formData.companyType,
        industry: 'legal_services',
        foundedYear: parseInt(formData.foundedYear) || new Date().getFullYear(),
        employeeCount: formData.employeeCount,
        annualRevenue: formData.annualRevenue,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logoUrl: null,
        description: formData.description,
        specializations: JSON.stringify(formData.specializations),
        certifications: JSON.stringify(formData.certifications),
        billingRate: parseFloat(formData.billingRate) || 0,
        currency: formData.currency,
        timezone: formData.timezone,
        subscriptionPlan: formData.subscriptionPlan,
        subscriptionStatus: 'active',
        trialEndsAt: formData.subscriptionPlan === 'trial' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Create user profile
      await blink.db.userProfiles.create({
        id: profileId,
        userId: user.id,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        phone: formData.userPhone,
        title: formData.userTitle,
        firmName: formData.companyName,
        address: formData.address,
        avatarUrl: null,
        companyId: companyId,
        department: 'Legal',
        bio: formData.userBio,
        linkedinUrl: formData.linkedinUrl,
        barNumber: formData.barNumber,
        licenseState: formData.licenseState,
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Create company membership
      await blink.db.companyMembers.create({
        id: membershipId,
        companyId: companyId,
        userId: user.id,
        role: 'owner',
        title: formData.userTitle,
        department: 'Legal',
        permissions: JSON.stringify({
          admin: true,
          cases: { create: true, read: true, update: true, delete: true },
          documents: { create: true, read: true, update: true, delete: true },
          clients: { create: true, read: true, update: true, delete: true },
          billing: { create: true, read: true, update: true, delete: true },
          settings: { read: true, update: true }
        }),
        invitedBy: user.id,
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Update firm settings for backward compatibility
      await blink.db.firmSettings.create({
        id: `firm_${Date.now()}`,
        userId: user.id,
        firmName: formData.companyName,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logoUrl: null,
        billingRate: parseFloat(formData.billingRate) || 0,
        currency: formData.currency,
        timezone: formData.timezone,
        specialization: formData.specializations.join(', '),
        barNumber: formData.barNumber,
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        firmSize: formData.employeeCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Registration Complete!",
        description: "Your company has been successfully registered. Welcome to LegalAI!",
      })

      onComplete()
    } catch (error) {
      console.error('Error creating company:', error)
      toast({
        title: "Registration Failed",
        description: "Failed to register your company. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Company Information</h3>
              <p className="text-gray-600">Tell us about your law firm or legal practice</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Smith & Associates Law Firm"
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name (if different)</Label>
                <Input
                  id="legalName"
                  placeholder="Smith & Associates LLC"
                  value={formData.legalName}
                  onChange={(e) => updateFormData('legalName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyType">Company Type *</Label>
                <Select value={formData.companyType} onValueChange={(value) => updateFormData('companyType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Company Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@smithlaw.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input
                  id="taxId"
                  placeholder="12-3456789"
                  value={formData.taxId}
                  onChange={(e) => updateFormData('taxId', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="foundedYear">Founded Year</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  placeholder="2020"
                  value={formData.foundedYear}
                  onChange={(e) => updateFormData('foundedYear', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employeeCount">Number of Employees</Label>
                <Select value={formData.employeeCount} onValueChange={(value) => updateFormData('employeeCount', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeCounts.map(count => (
                      <SelectItem key={count} value={count}>{count}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="annualRevenue">Annual Revenue</Label>
                <Select value={formData.annualRevenue} onValueChange={(value) => updateFormData('annualRevenue', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueRanges.map(range => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your law firm and services..."
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Contact Information</h3>
              <p className="text-gray-600">Where is your firm located?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street, Suite 100"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  value={formData.state}
                  onChange={(e) => updateFormData('state', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  placeholder="10001"
                  value={formData.zipCode}
                  onChange={(e) => updateFormData('zipCode', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://www.smithlaw.com"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                />
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Practice Areas</h3>
              <p className="text-gray-600">What areas of law do you practice? (Select all that apply)</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {practiceAreas.map(area => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={area}
                    checked={formData.specializations.includes(area)}
                    onCheckedChange={(checked) => handleSpecializationChange(area, checked as boolean)}
                  />
                  <Label htmlFor={area} className="text-sm">{area}</Label>
                </div>
              ))}
            </div>
            
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-medium">Certifications & Awards</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {certifications.map(cert => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={cert}
                      checked={formData.certifications.includes(cert)}
                      onCheckedChange={(checked) => handleCertificationChange(cert, checked as boolean)}
                    />
                    <Label htmlFor={cert} className="text-sm">{cert}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="space-y-2">
                <Label htmlFor="billingRate">Standard Billing Rate ($/hour)</Label>
                <Input
                  id="billingRate"
                  type="number"
                  placeholder="250"
                  value={formData.billingRate}
                  onChange={(e) => updateFormData('billingRate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => updateFormData('currency', value)}>
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
                  value={formData.timezone}
                  onChange={(e) => updateFormData('timezone', e.target.value)}
                />
              </div>
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Your Profile</h3>
              <p className="text-gray-600">Tell us about yourself</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userTitle">Your Title *</Label>
                <Select value={formData.userTitle} onValueChange={(value) => updateFormData('userTitle', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Attorney">Attorney</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Senior Partner">Senior Partner</SelectItem>
                    <SelectItem value="Managing Partner">Managing Partner</SelectItem>
                    <SelectItem value="Associate">Associate</SelectItem>
                    <SelectItem value="Senior Associate">Senior Associate</SelectItem>
                    <SelectItem value="Paralegal">Paralegal</SelectItem>
                    <SelectItem value="Legal Assistant">Legal Assistant</SelectItem>
                    <SelectItem value="Solo Practitioner">Solo Practitioner</SelectItem>
                    <SelectItem value="General Counsel">General Counsel</SelectItem>
                    <SelectItem value="Legal Consultant">Legal Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userPhone">Your Phone Number</Label>
                <Input
                  id="userPhone"
                  placeholder="(555) 123-4567"
                  value={formData.userPhone}
                  onChange={(e) => updateFormData('userPhone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Experience *</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  placeholder="5"
                  value={formData.yearsExperience}
                  onChange={(e) => updateFormData('yearsExperience', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Your Hourly Rate ($/hour)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="250"
                  value={formData.hourlyRate}
                  onChange={(e) => updateFormData('hourlyRate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="barNumber">Bar Number</Label>
                <Input
                  id="barNumber"
                  placeholder="123456"
                  value={formData.barNumber}
                  onChange={(e) => updateFormData('barNumber', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licenseState">License State</Label>
                <Input
                  id="licenseState"
                  placeholder="NY"
                  value={formData.licenseState}
                  onChange={(e) => updateFormData('licenseState', e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedinUrl}
                  onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userBio">Professional Bio</Label>
              <Textarea
                id="userBio"
                placeholder="Brief professional biography..."
                value={formData.userBio}
                onChange={(e) => updateFormData('userBio', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <DollarSign className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Choose Your Plan</h3>
              <p className="text-gray-600">Select the plan that best fits your needs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionPlans.map(plan => (
                <Card 
                  key={plan.value} 
                  className={`cursor-pointer transition-all ${
                    formData.subscriptionPlan === plan.value 
                      ? 'ring-2 ring-blue-600 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => updateFormData('subscriptionPlan', plan.value)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">{plan.label}</h4>
                      <span className="text-2xl font-bold text-blue-600">{plan.price}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      {plan.value === 'trial' && (
                        <>
                          <div>• 30-day free trial</div>
                          <div>• Up to 10 cases</div>
                          <div>• Basic AI features</div>
                          <div>• Email support</div>
                        </>
                      )}
                      {plan.value === 'starter' && (
                        <>
                          <div>• Unlimited cases</div>
                          <div>• Advanced AI features</div>
                          <div>• Document management</div>
                          <div>• Priority support</div>
                        </>
                      )}
                      {plan.value === 'professional' && (
                        <>
                          <div>• Everything in Starter</div>
                          <div>• Multi-user support</div>
                          <div>• Advanced analytics</div>
                          <div>• API access</div>
                        </>
                      )}
                      {plan.value === 'enterprise' && (
                        <>
                          <div>• Everything in Professional</div>
                          <div>• Custom integrations</div>
                          <div>• Dedicated support</div>
                          <div>• Custom training</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> You can change your plan at any time. All plans include a 30-day money-back guarantee.
              </p>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Scale className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Company Registration
          </CardTitle>
          <p className="text-gray-600">
            Step {currentStep} of 5: Set up your law firm profile
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between pt-8 border-t mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading || !validateStep(5)}
              >
                {loading ? 'Creating Company...' : 'Complete Registration'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}