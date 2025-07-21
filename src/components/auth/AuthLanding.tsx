import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Scale, Users, Shield, Zap, BarChart3, FileText, MessageSquare, Calendar } from 'lucide-react'
import { blink } from '@/blink/client'

export function AuthLanding() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      await blink.auth.login(window.location.origin) // Redirect to current page after auth
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    try {
      await blink.auth.login(window.location.origin) // Redirect to current page after auth
    } catch (error) {
      console.error('Signup error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <Scale className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered Legal
              <span className="text-blue-600 block">Case Management</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your law firm operations with intelligent case management, 
              AI-powered insurance negotiations, and automated document processing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleSignUp}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Start Free Trial'}
              </Button>
              
              <Button
                onClick={handleLogin}
                variant="outline"
                size="lg"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg"
                disabled={loading}
              >
                Sign In
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              30-day free trial • No credit card required • Setup in 5 minutes
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything Your Law Firm Needs
          </h2>
          <p className="text-xl text-gray-600">
            Powerful tools designed specifically for legal professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Case Management</h3>
              <p className="text-gray-600 text-sm">
                Organize cases, track deadlines, and manage client information in one place
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Negotiator</h3>
              <p className="text-gray-600 text-sm">
                AI-powered insurance negotiations and settlement recommendations
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Document Security</h3>
              <p className="text-gray-600 text-sm">
                Bank-grade security for all your sensitive legal documents
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm">
                Track firm performance, case outcomes, and revenue insights
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Legal Professionals Choose Our Platform
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Save 10+ Hours Per Week</h3>
                    <p className="text-gray-600">
                      Automate routine tasks and focus on what matters most - your clients
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Better Client Outcomes</h3>
                    <p className="text-gray-600">
                      AI-powered insights help you achieve better settlements and case results
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Never Miss a Deadline</h3>
                    <p className="text-gray-600">
                      Automated reminders and calendar integration keep you on track
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Practice?</h3>
              <p className="text-blue-100 mb-6">
                Join thousands of legal professionals who have streamlined their operations with our platform.
              </p>
              
              <div className="space-y-4">
                <Button
                  onClick={handleSignUp}
                  size="lg"
                  className="w-full bg-white text-blue-600 hover:bg-gray-100"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Start Your Free Trial'}
                </Button>
                
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  size="lg"
                  className="w-full border-white text-white hover:bg-white hover:text-blue-600"
                  disabled={loading}
                >
                  Already have an account? Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Scale className="h-6 w-6" />
            <span className="text-xl font-semibold">Monster Law App</span>
          </div>
          <p className="text-gray-400">
            © 2024 AI Legal Case Manager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}