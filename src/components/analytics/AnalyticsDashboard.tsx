import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  FileText,
  Target,
  Award,
  Calendar,
  AlertTriangle
} from 'lucide-react'

import { blink } from '@/blink/client'

interface AnalyticsData {
  totalCases: number
  activeCases: number
  settledCases: number
  totalSettlements: number
  avgSettlementTime: number
  successRate: number
  monthlyData: Array<{
    month: string
    cases: number
    settlements: number
    revenue: number
  }>
  casesByType: Array<{
    type: string
    count: number
    value: number
  }>
  performanceMetrics: {
    negotiationSuccess: number
    clientSatisfaction: number
    documentProcessing: number
    responseTime: number
  }
}

const COLORS = ['#1e40af', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6months')

  const loadAnalytics = async () => {
    try {
      // Load cases data
      const cases = await blink.db.cases.list()
      const negotiations = await blink.db.negotiations.list()
      
      // Calculate analytics
      const totalCases = cases.length
      const activeCases = cases.filter(c => c.status === 'active').length
      const settledCases = cases.filter(c => c.status === 'settled').length
      
      const settlements = cases
        .filter(c => c.settlement_amount && Number(c.settlement_amount) > 0)
        .map(c => Number(c.settlement_amount))
      
      const totalSettlements = settlements.reduce((sum, amount) => sum + amount, 0)
      const avgSettlementTime = 45 // Mock data - would calculate from actual case durations
      const successRate = settledCases > 0 ? (settledCases / totalCases) * 100 : 0

      // Generate monthly data (mock for demo)
      const monthlyData = [
        { month: 'Jan', cases: 12, settlements: 8, revenue: 450000 },
        { month: 'Feb', cases: 15, settlements: 10, revenue: 520000 },
        { month: 'Mar', cases: 18, settlements: 12, revenue: 680000 },
        { month: 'Apr', cases: 14, settlements: 9, revenue: 420000 },
        { month: 'May', cases: 20, settlements: 15, revenue: 750000 },
        { month: 'Jun', cases: 16, settlements: 11, revenue: 580000 }
      ]

      // Case types analysis
      const typeCount: { [key: string]: { count: number, value: number } } = {}
      cases.forEach(case_ => {
        const type = case_.case_type || 'Other'
        if (!typeCount[type]) {
          typeCount[type] = { count: 0, value: 0 }
        }
        typeCount[type].count++
        typeCount[type].value += Number(case_.settlement_amount || 0)
      })

      const casesByType = Object.entries(typeCount).map(([type, data]) => ({
        type,
        count: data.count,
        value: data.value
      }))

      const performanceMetrics = {
        negotiationSuccess: 87,
        clientSatisfaction: 94,
        documentProcessing: 92,
        responseTime: 89
      }

      setAnalytics({
        totalCases,
        activeCases,
        settledCases,
        totalSettlements,
        avgSettlementTime,
        successRate,
        monthlyData,
        casesByType,
        performanceMetrics
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string
    value: number
    change?: number
    icon: any
    format?: 'number' | 'currency' | 'percentage' | 'days'
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return formatCurrency(val)
        case 'percentage': return `${val.toFixed(1)}%`
        case 'days': return `${val} days`
        default: return val.toLocaleString()
      }
    }

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
              {change !== undefined && (
                <div className="flex items-center mt-1">
                  {change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(change)}%
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading || !analytics) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track performance, settlements, and key metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cases"
          value={analytics.totalCases}
          change={12}
          icon={FileText}
        />
        <StatCard
          title="Active Cases"
          value={analytics.activeCases}
          change={8}
          icon={Clock}
        />
        <StatCard
          title="Total Settlements"
          value={analytics.totalSettlements}
          change={15}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Success Rate"
          value={analytics.successRate}
          change={5}
          icon={Target}
          format="percentage"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cases">Case Analysis</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Case Volume</CardTitle>
                <CardDescription>New cases and settlements over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="cases" 
                      stackId="1"
                      stroke="#1e40af" 
                      fill="#1e40af" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="settlements" 
                      stackId="2"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case Distribution</CardTitle>
                <CardDescription>Cases by type and value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.casesByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type} (${count})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.casesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly settlement revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Negotiation Success</span>
                    <span className="text-sm text-gray-600">{analytics.performanceMetrics.negotiationSuccess}%</span>
                  </div>
                  <Progress value={analytics.performanceMetrics.negotiationSuccess} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Client Satisfaction</span>
                    <span className="text-sm text-gray-600">{analytics.performanceMetrics.clientSatisfaction}%</span>
                  </div>
                  <Progress value={analytics.performanceMetrics.clientSatisfaction} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Document Processing</span>
                    <span className="text-sm text-gray-600">{analytics.performanceMetrics.documentProcessing}%</span>
                  </div>
                  <Progress value={analytics.performanceMetrics.documentProcessing} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm text-gray-600">{analytics.performanceMetrics.responseTime}%</span>
                  </div>
                  <Progress value={analytics.performanceMetrics.responseTime} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Achievements</CardTitle>
                <CardDescription>Recent milestones and awards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Top Settlement Rate</p>
                    <p className="text-sm text-gray-600">Achieved 94% success rate this quarter</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Revenue Growth</p>
                    <p className="text-sm text-gray-600">15% increase in monthly settlements</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Faster Processing</p>
                    <p className="text-sm text-gray-600">Reduced case resolution time by 20%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cases" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Case Types Performance</CardTitle>
                <CardDescription>Settlement success by case type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.casesByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#1e40af" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case Status</CardTitle>
                <CardDescription>Current case distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Cases</span>
                  <Badge variant="default">{analytics.activeCases}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Settled Cases</span>
                  <Badge variant="secondary">{analytics.settledCases}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Review</span>
                  <Badge variant="outline">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">On Hold</span>
                  <Badge variant="destructive">1</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Average Settlement"
              value={analytics.totalSettlements / Math.max(analytics.settledCases, 1)}
              change={8}
              icon={DollarSign}
              format="currency"
            />
            <StatCard
              title="Settlement Time"
              value={analytics.avgSettlementTime}
              change={-12}
              icon={Calendar}
              format="days"
            />
            <StatCard
              title="Collection Rate"
              value={96.5}
              change={2}
              icon={Target}
              format="percentage"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Revenue and settlement trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1e40af" 
                    fill="#1e40af" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}