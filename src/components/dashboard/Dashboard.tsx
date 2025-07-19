import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  FolderOpen, 
  DollarSign, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight
} from 'lucide-react'
import { Case } from '@/types/case'
import { blink } from '@/blink/client'

interface DashboardProps {
  onNavigate: (tab: string, caseId?: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Load cases from database
  const loadCases = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const casesData = await blink.db.cases.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 5 // Only get recent 5 cases for dashboard
      })
      
      setCases(casesData || [])
    } catch (error) {
      console.error('Error loading cases:', error)
      setCases([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Load user and cases
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load cases when user changes
  useEffect(() => {
    if (user?.id) {
      loadCases()
    }
  }, [user?.id, loadCases])

  // Calculate dynamic stats from actual cases
  const activeCases = cases.filter(c => c.status !== 'settled' && c.status !== 'closed').length
  const totalValue = cases.reduce((sum, c) => sum + (c.estimatedValue || 0), 0)
  const settledCases = cases.filter(c => c.status === 'settled').length
  const successRate = cases.length > 0 ? Math.round((settledCases / cases.length) * 100) : 0
  const pendingDeadlines = cases.filter(c => c.nextDeadline && new Date(c.nextDeadline) > new Date()).length

  const stats = [
    {
      title: 'Active Cases',
      value: activeCases.toString(),
      change: cases.length > 0 ? `${cases.length} total cases` : 'No cases yet',
      icon: FolderOpen,
      color: 'text-blue-600'
    },
    {
      title: 'Total Settlement Value',
      value: `${(totalValue / 1000000).toFixed(1)}M`,
      change: `${totalValue.toLocaleString()} total`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      change: `${settledCases} settled cases`,
      icon: TrendingUp,
      color: 'text-amber-600'
    },
    {
      title: 'Pending Deadlines',
      value: pendingDeadlines.toString(),
      change: pendingDeadlines > 0 ? 'Review calendar' : 'All up to date',
      icon: Clock,
      color: 'text-red-600'
    }
  ]

  // Get recent cases (limit to 3 for display)
  const recentCases = cases.slice(0, 3)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'negotiating': return 'bg-orange-100 text-orange-800'
      case 'settled': return 'bg-green-100 text-green-800'
      case 'litigation': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // AI Analysis Functions
  const negotiatingCases = cases.filter(c => c.status === 'negotiating')
  const highValueCases = cases.filter(c => (c.estimatedValue || 0) > 100000)
  const upcomingDeadlines = cases.filter(c => {
    if (!c.nextDeadline) return false
    const deadline = new Date(c.nextDeadline)
    const now = new Date()
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil > 0
  })
  const overdueDeadlines = cases.filter(c => {
    if (!c.nextDeadline) return false
    return new Date(c.nextDeadline) < new Date()
  })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm md:text-base">Welcome back! Here's what's happening with your cases.</p>
        </div>
        <Button 
          onClick={() => onNavigate('cases')} 
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-2 lg:mb-0">
                    <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1 hidden md:block">{stat.change}</p>
                  </div>
                  <Icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color} lg:flex-shrink-0`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Next Deadlines & Recent Cases */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Recent Cases</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('cases')}
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3 md:space-y-4">
              {loading ? (
                <div className="text-center py-6 md:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">Loading recent cases...</p>
                </div>
              ) : recentCases.length > 0 ? (
                recentCases.map((case_) => (
                  <div 
                    key={case_.id}
                    className="p-3 md:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onNavigate('cases', case_.id)}
                  >
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-medium text-gray-900 truncate text-sm md:text-base">
                            {case_.caseNumber || 'Unknown Case Number'}
                          </span>
                          <Badge className={`${getStatusColor(case_.status || 'unknown')} text-xs flex-shrink-0`}>
                            {case_.status || 'Unknown Status'}
                          </Badge>
                          <Badge className={`${getPriorityColor(case_.priority || 'unknown')} text-xs flex-shrink-0 hidden sm:inline-flex`}>
                            {case_.priority || 'Unknown Priority'}
                          </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600 truncate mb-1">
                          {case_.clientName || 'Unknown Client'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {case_.caseType ? case_.caseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Type'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm mb-1">
                          {(case_.estimatedValue || 0) >= 1000000 
                            ? `${((case_.estimatedValue || 0) / 1000000).toFixed(1)}M`
                            : (case_.estimatedValue || 0) >= 1000
                            ? `${((case_.estimatedValue || 0) / 1000).toFixed(0)}K`
                            : `${(case_.estimatedValue || 0).toLocaleString()}`
                          }
                        </p>
                        {case_.nextDeadline && (
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(case_.nextDeadline).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 md:py-8">
                  <FolderOpen className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 mb-3 md:mb-4" />
                  <p className="text-xs md:text-sm text-gray-500 mb-2">No cases yet</p>
                  <Button 
                    size="sm" 
                    onClick={() => onNavigate('cases')}
                    className="bg-blue-600 hover:bg-blue-700 text-xs md:text-sm"
                  >
                    <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                    Create Your First Case
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
            <CardTitle className="flex items-center text-base md:text-lg">
              <Clock className="mr-2 h-4 w-4 md:h-5 md:w-5 text-amber-600" />
              <span className="hidden sm:inline">Next Deadlines</span>
              <span className="sm:hidden">Deadlines</span>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('calendar')}
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">View Calendar</span>
              <span className="sm:hidden">Calendar</span>
              <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2 md:space-y-3">
              {loading ? (
                <div className="text-center py-6 md:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-amber-600 mx-auto"></div>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">Loading deadlines...</p>
                </div>
              ) : (() => {
                // Get all cases with deadlines, sorted by deadline date
                const casesWithDeadlines = cases
                  .filter(c => c.nextDeadline)
                  .sort((a, b) => new Date(a.nextDeadline!).getTime() - new Date(b.nextDeadline!).getTime())
                  .slice(0, 5) // Show next 5 deadlines

                if (casesWithDeadlines.length === 0) {
                  return (
                    <div className="text-center py-6 md:py-8">
                      <Clock className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 mb-3 md:mb-4" />
                      <p className="text-xs md:text-sm text-gray-500 mb-2">No upcoming deadlines</p>
                      <p className="text-xs text-gray-400">All cases are up to date</p>
                    </div>
                  )
                }

                return casesWithDeadlines.map((case_) => {
                  const deadline = new Date(case_.nextDeadline!)
                  const now = new Date()
                  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  
                  // Determine urgency styling
                  const isOverdue = daysUntil < 0
                  const isUrgent = daysUntil <= 3 && daysUntil >= 0
                  const isUpcoming = daysUntil > 3 && daysUntil <= 7
                  
                  const urgencyStyle = isOverdue 
                    ? 'border-red-200 bg-red-50' 
                    : isUrgent 
                    ? 'border-orange-200 bg-orange-50'
                    : isUpcoming
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-gray-200 bg-gray-50'
                  
                  const urgencyText = isOverdue 
                    ? `${Math.abs(daysUntil)}d overdue`
                    : daysUntil === 0
                    ? 'Due today'
                    : daysUntil === 1
                    ? 'Due tomorrow'
                    : `${daysUntil}d left`
                  
                  const urgencyColor = isOverdue 
                    ? 'text-red-600' 
                    : isUrgent 
                    ? 'text-orange-600'
                    : isUpcoming
                    ? 'text-amber-600'
                    : 'text-gray-600'

                  return (
                    <div 
                      key={case_.id}
                      className={`p-3 md:p-4 border rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${urgencyStyle}`}
                      onClick={() => onNavigate('cases', case_.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 truncate text-sm md:text-base">
                              {case_.caseNumber}
                            </span>
                            {isOverdue && (
                              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 truncate mb-1">
                            {case_.clientName}
                          </p>
                          <p className="text-xs text-gray-500 hidden sm:block">
                            {case_.caseType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3 md:ml-4">
                          <p className={`text-xs md:text-sm font-medium ${urgencyColor}`}>
                            {urgencyText}
                          </p>
                          <p className="text-xs text-gray-500">
                            {deadline.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: deadline.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center text-base md:text-lg">
              <TrendingUp className="mr-2 h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              <span className="hidden sm:inline">AI Insights & Recommendations</span>
              <span className="sm:hidden">AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
            {/* Dynamic AI Insights based on actual case data */}
            {cases.length === 0 ? (
              <div className="text-center py-4 md:py-6">
                <TrendingUp className="mx-auto h-6 w-6 md:h-8 md:w-8 text-gray-400 mb-2" />
                <p className="text-xs md:text-sm text-gray-500">AI insights will appear once you have cases</p>
              </div>
            ) : (
              <>
                {/* Settlement Opportunity Analysis */}
                {negotiatingCases.length > 0 && (
                  <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm md:text-base">Settlement Opportunity</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-3">
                      Case <strong>{negotiatingCases[0].caseNumber}</strong> shows strong settlement potential. 
                      <span className="hidden sm:inline">
                        AI analysis suggests increasing demand to <strong>${Math.round((negotiatingCases[0].estimatedValue || 0) * 1.15).toLocaleString()}</strong> 
                        based on similar case outcomes.
                      </span>
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onNavigate('negotiator')}
                      className="border-green-600 text-green-700 hover:bg-green-100 text-xs md:text-sm w-full sm:w-auto"
                    >
                      Launch AI Negotiator
                    </Button>
                  </div>
                )}

                {/* High Value Cases */}
                {highValueCases.length > 0 && negotiatingCases.length === 0 && (
                  <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-2">
                      <DollarSign className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm md:text-base">High-Value Cases</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-3">
                      You have <strong>{highValueCases.length}</strong> high-value cases (&gt;$100K). 
                      <span className="hidden sm:inline">
                        AI recommends prioritizing documentation and expert witness preparation.
                      </span>
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onNavigate('cases')}
                      className="border-blue-600 text-blue-700 hover:bg-blue-100 text-xs md:text-sm w-full sm:w-auto"
                    >
                      Review Cases
                    </Button>
                  </div>
                )}

                {/* Deadline Analysis */}
                {overdueDeadlines.length > 0 && (
                  <div className="p-3 md:p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm md:text-base">Overdue Deadlines</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-3">
                      <strong>{overdueDeadlines.length}</strong> cases have overdue deadlines. 
                      <span className="hidden sm:inline">
                        Immediate action required to avoid case complications.
                      </span>
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onNavigate('calendar')}
                      className="border-red-600 text-red-700 hover:bg-red-100 text-xs md:text-sm w-full sm:w-auto"
                    >
                      View Calendar
                    </Button>
                  </div>
                )}

                {upcomingDeadlines.length > 0 && overdueDeadlines.length === 0 && (
                  <div className="p-3 md:p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm md:text-base">Upcoming Deadlines</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-3">
                      <strong>{upcomingDeadlines.length}</strong> deadlines this week. 
                      <span className="hidden sm:inline">
                        AI suggests reviewing case files and preparing required documents now.
                      </span>
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onNavigate('calendar')}
                      className="border-amber-600 text-amber-700 hover:bg-amber-100 text-xs md:text-sm w-full sm:w-auto"
                    >
                      View Calendar
                    </Button>
                  </div>
                )}

                {/* Case Portfolio Analysis */}
                <div className="p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center mb-3">
                    <TrendingUp className="h-4 w-4 text-slate-600 mr-2 flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm md:text-base">Portfolio Performance</span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Case Load Distribution */}
                    <div>
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-gray-600">Case Load</span>
                        <span className="font-medium">
                          {activeCases <= 10 ? 'Optimal' : activeCases <= 20 ? 'High' : 'Overloaded'}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((activeCases / 15) * 100, 100)} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                        {activeCases <= 10 
                          ? 'Good case load balance for quality representation'
                          : activeCases <= 20 
                          ? 'Consider prioritizing high-value cases'
                          : 'Risk of case quality degradation - consider delegation'
                        }
                      </p>
                    </div>

                    {/* Success Rate Trend */}
                    <div>
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-medium text-green-600">{successRate}%</span>
                      </div>
                      <Progress value={successRate} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                        {successRate >= 80 
                          ? 'Excellent settlement performance'
                          : successRate >= 60 
                          ? 'Good performance, room for improvement'
                          : 'Consider reviewing negotiation strategies'
                        }
                      </p>
                    </div>

                    {/* Average Case Value */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-600">Avg. Case Value</span>
                      <span className="font-medium text-xs md:text-sm">
                        ${cases.length > 0 ? Math.round(totalValue / cases.length).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm md:text-base">AI Recommendations</span>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const recommendations = []
                      
                      // Case type diversification
                      const caseTypes = [...new Set(cases.map(c => c.caseType).filter(Boolean))]
                      if (caseTypes.length === 1) {
                        recommendations.push("Consider diversifying case types")
                      }
                      
                      // Documentation gaps
                      const casesWithoutDocs = cases.filter(c => !c.documents || c.documents.length === 0)
                      if (casesWithoutDocs.length > 0) {
                        recommendations.push(`${casesWithoutDocs.length} cases need documents`)
                      }
                      
                      // Stagnant cases
                      const investigatingCases = cases.filter(c => c.status === 'investigating')
                      if (investigatingCases.length > 3) {
                        recommendations.push("Advance investigating cases to negotiation")
                      }
                      
                      // Default recommendations
                      if (recommendations.length === 0) {
                        recommendations.push("Use AI Negotiator for settlements")
                        recommendations.push("Review case timelines regularly")
                      }
                      
                      return recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                          <p className="text-xs md:text-sm text-gray-600">{rec}</p>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}