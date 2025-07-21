import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Scale, Building, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface ProfileSetupProps {
  user: any
  onComplete: () => void
}

export function ProfileSetup({ user, onComplete }: ProfileSetupProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    title: 'Attorney',
    firmName: '',
    address: '',
    specialization: '',
    barNumber: '',
    yearsExperience: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.firmName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Create user profile
      await blink.db.userProfiles.create({
        id: `profile_${Date.now()}`,
        userId: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        title: formData.title,
        firmName: formData.firmName,
        address: formData.address,
        avatarUrl: null,
        createdAt: new Date().toISOString()
      })

      // Create firm settings
      await blink.db.firmSettings.create({
        id: `firm_${Date.now()}`,
        userId: user.id,
        firmName: formData.firmName,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        specialization: formData.specialization,
        barNumber: formData.barNumber,
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Success",
        description: "Your profile has been created successfully!",
      })

      onComplete()
    } catch (error) {
      console.error('Error creating profile:', error)
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Scale className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Monster Law App
          </CardTitle>
          <p className="text-gray-600">
            Let's set up your law firm profile to get started
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Select value={formData.title} onValueChange={(value) => setFormData(prev => ({ ...prev, title: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Attorney">Attorney</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Associate">Associate</SelectItem>
                      <SelectItem value="Paralegal">Paralegal</SelectItem>
                      <SelectItem value="Legal Assistant">Legal Assistant</SelectItem>
                      <SelectItem value="Solo Practitioner">Solo Practitioner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Firm Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Building className="mr-2 h-5 w-5 text-blue-600" />
                Law Firm Information
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firmName">Law Firm Name *</Label>
                  <Input
                    id="firmName"
                    placeholder="Enter your law firm name"
                    value={formData.firmName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firmName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Firm Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your firm's address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Practice Areas</Label>
                    <Input
                      id="specialization"
                      placeholder="e.g., Personal Injury, Corporate Law"
                      value={formData.specialization}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">Years of Experience</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      placeholder="0"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barNumber">Bar Number (Optional)</Label>
                  <Input
                    id="barNumber"
                    placeholder="Enter your bar number"
                    value={formData.barNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, barNumber: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-8"
                disabled={loading}
              >
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}