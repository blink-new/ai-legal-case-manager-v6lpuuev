import { useState, useEffect } from 'react'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { CaseList } from '@/components/cases/CaseList'
import { CaseDetail } from '@/components/cases/CaseDetail'
import { DocumentManager } from '@/components/documents/DocumentManager'
import { AINegotiator } from '@/components/negotiator/AINegotiator'
import { Calendar } from '@/components/calendar/Calendar'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { Settings } from '@/components/settings/Settings'
import { ClientManagement } from '@/components/client/ClientManagement'
import { Sidebar } from '@/components/layout/Sidebar'
import { DeadlineTest } from '@/components/debug/DeadlineTest'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu, LogOut } from 'lucide-react'
import { blink } from '@/blink/client'

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const logout = () => {
    blink.auth.logout()
  }

  const handleNavigation = (tab: string, caseId?: string) => {
    console.log('Navigation clicked:', tab, caseId ? `with caseId: ${caseId}` : '')
    setActiveTab(tab)
    if (caseId) {
      setSelectedCaseId(caseId)
    }
    setMobileMenuOpen(false) // Close mobile menu on navigation
  }

  const handleCaseSelect = (caseId: string) => {
    console.log('Case selected:', caseId)
    setSelectedCaseId(caseId)
    setActiveTab('case-detail')
  }

  const renderContent = () => {
    console.log('Rendering content for tab:', activeTab)
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigation} />
      case 'cases':
        return <CaseList onCaseSelect={handleCaseSelect} />
      case 'case-detail':
        return selectedCaseId ? (
          <CaseDetail 
            caseId={selectedCaseId} 
            onBack={() => setActiveTab('cases')}
            onNavigate={handleNavigation}
          />
        ) : (
          <CaseList onCaseSelect={handleCaseSelect} />
        )
      case 'documents':
        return <DocumentManager />
      case 'negotiator':
        return <AINegotiator />
      case 'calendar':
        return <Calendar />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'settings':
        return <Settings />
      case 'clients':
        return <ClientManagement />
      case 'debug-deadline':
        return <DeadlineTest />
      default:
        return <Dashboard onNavigate={handleNavigation} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Legal Case Manager</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your legal case management dashboard</p>
          <Button onClick={() => blink.auth.login()} className="bg-blue-600 hover:bg-blue-700">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Desktop Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <Sidebar activeTab={activeTab} onTabChange={handleNavigation} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 lg:p-8">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">LegalAI</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <Sidebar activeTab={activeTab} onTabChange={handleNavigation} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Content */}
        <main className="p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App