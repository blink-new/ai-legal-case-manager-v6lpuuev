import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Bell,
  Video,
  Phone,
  FileText,
  Gavel,
  User
} from 'lucide-react'
import { blink } from '../../blink/client'
import { useToast } from '../../hooks/use-toast'

interface CalendarEvent {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  event_type: 'meeting' | 'court' | 'deadline' | 'consultation' | 'deposition' | 'other'
  location: string
  attendees: string
  case_id?: string
  priority: 'low' | 'medium' | 'high'
  reminder_minutes: number
  user_id: string
  created_at: string
}

interface Case {
  id: string
  title: string
  client_name: string
}

const eventTypeColors = {
  meeting: 'bg-blue-100 text-blue-800 border-blue-200',
  court: 'bg-red-100 text-red-800 border-red-200',
  deadline: 'bg-orange-100 text-orange-800 border-orange-200',
  consultation: 'bg-green-100 text-green-800 border-green-200',
  deposition: 'bg-purple-100 text-purple-800 border-purple-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
}

const eventTypeIcons = {
  meeting: Users,
  court: Gavel,
  deadline: AlertCircle,
  consultation: User,
  deposition: FileText,
  other: Clock
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const { toast } = useToast()

  // New event form
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'meeting',
    location: '',
    attendees: '',
    case_id: '',
    priority: 'medium',
    reminder_minutes: 15
  })

  const loadUserData = async () => {
    try {
      const userData = await blink.auth.me()
      setUser(userData)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (user) {
      const loadEvents = async () => {
        try {
          setLoading(true)
          const eventList = await blink.db.calendarEvents.list({
            where: { userId: user.id },
            orderBy: { startDate: 'asc' }
          })
          setEvents(eventList)
        } catch (error) {
          console.error('Error loading events:', error)
        } finally {
          setLoading(false)
        }
      }

      const loadCases = async () => {
        try {
          const caseList = await blink.db.cases.list({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
          })
          setCases(caseList)
        } catch (error) {
          console.error('Error loading cases:', error)
        }
      }

      loadEvents()
      loadCases()
    }
  }, [user])

  const createEvent = async () => {
    if (!user || !newEvent.title || !newEvent.start_date) {
      toast({
        title: "Error",
        description: "Please fill in required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const event = await blink.db.calendarEvents.create({
        id: `event_${Date.now()}`,
        userId: user.id,
        title: newEvent.title,
        description: newEvent.description || '',
        startDate: newEvent.start_date,
        endDate: newEvent.end_date || newEvent.start_date,
        eventType: newEvent.event_type || 'meeting',
        location: newEvent.location || '',
        attendees: newEvent.attendees || '',
        caseId: newEvent.case_id || '',
        priority: newEvent.priority || 'medium',
        reminderMinutes: newEvent.reminder_minutes || 15,
        createdAt: new Date().toISOString()
      })

      setEvents(prev => [...prev, event])
      setNewEvent({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        event_type: 'meeting',
        location: '',
        attendees: '',
        case_id: '',
        priority: 'medium',
        reminder_minutes: 15
      })
      setShowEventDialog(false)

      toast({
        title: "Event Created",
        description: "Your calendar event has been created successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      await blink.db.calendarEvents.delete(eventId)
      setEvents(prev => prev.filter(e => e.id !== eventId))
      setSelectedEvent(null)
      
      toast({
        title: "Event Deleted",
        description: "The event has been removed from your calendar."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || event.eventType === filterType
    return matchesSearch && matchesFilter
  })

  const upcomingEvents = events
    .filter(event => new Date(event.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="court">Court</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
              <SelectItem value="consultation">Consultations</SelectItem>
              <SelectItem value="deposition">Depositions</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add a new event to your calendar.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Title *</Label>
                    <Input
                      id="event-title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Event title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Type</Label>
                    <Select
                      value={newEvent.event_type}
                      onValueChange={(value) => setNewEvent(prev => ({ ...prev, event_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="court">Court Hearing</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="deposition">Deposition</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date & Time *</Label>
                    <Input
                      id="start-date"
                      type="datetime-local"
                      value={newEvent.start_date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date & Time</Label>
                    <Input
                      id="end-date"
                      type="datetime-local"
                      value={newEvent.end_date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Event location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendees">Attendees</Label>
                    <Input
                      id="attendees"
                      value={newEvent.attendees}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, attendees: e.target.value }))}
                      placeholder="Comma-separated emails"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case-id">Related Case</Label>
                    <Select
                      value={newEvent.case_id}
                      onValueChange={(value) => setNewEvent(prev => ({ ...prev, case_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select case" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No case</SelectItem>
                        {cases.map((case_) => (
                          <SelectItem key={case_.id} value={case_.id}>
                            {case_.title} - {case_.clientName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newEvent.priority}
                      onValueChange={(value) => setNewEvent(prev => ({ ...prev, priority: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder">Reminder</Label>
                    <Select
                      value={newEvent.reminder_minutes?.toString()}
                      onValueChange={(value) => setNewEvent(prev => ({ ...prev, reminder_minutes: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No reminder</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="1440">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createEvent} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={view} onValueChange={(value) => setView(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((date, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-gray-200 ${
                      date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                    } ${
                      date && date.toDateString() === new Date().toDateString()
                        ? 'bg-blue-50 border-blue-200'
                        : ''
                    }`}
                  >
                    {date && (
                      <>
                        <div className="font-medium text-sm mb-1">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {getEventsForDate(date).slice(0, 2).map(event => {
                            const IconComponent = eventTypeIcons[event.eventType]
                            return (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded cursor-pointer ${eventTypeColors[event.eventType]}`}
                                onClick={() => setSelectedEvent(event)}
                              >
                                <div className="flex items-center space-x-1">
                                  <IconComponent className="h-3 w-3" />
                                  <span className="truncate">{event.title}</span>
                                </div>
                              </div>
                            )
                          })}
                          {getEventsForDate(date).length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{getEventsForDate(date).length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>All Events</CardTitle>
                  <CardDescription>
                    {filteredEvents.length} events found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No events found</p>
                      </div>
                    ) : (
                      filteredEvents.map(event => {
                        const IconComponent = eventTypeIcons[event.eventType]
                        return (
                          <div
                            key={event.id}
                            className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className={`p-2 rounded-lg ${eventTypeColors[event.eventType]}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {event.title}
                                </h3>
                                <Badge
                                  variant={event.priority === 'high' ? 'destructive' : 
                                          event.priority === 'medium' ? 'default' : 'secondary'}
                                >
                                  {event.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(event.startDate)} at {formatTime(event.startDate)}
                              </p>
                              {event.location && (
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {event.location}
                                </div>
                              )}
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.length === 0 ? (
                      <p className="text-gray-500 text-sm">No upcoming events</p>
                    ) : (
                      upcomingEvents.map(event => {
                        const IconComponent = eventTypeIcons[event.eventType]
                        return (
                          <div key={event.id} className="flex items-center space-x-3">
                            <div className={`p-1 rounded ${eventTypeColors[event.eventType]}`}>
                              <IconComponent className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {event.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(event.startDate)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Events</span>
                      <span className="font-medium">{events.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-medium">
                        {events.filter(e => {
                          const eventDate = new Date(e.startDate)
                          return eventDate.getMonth() === new Date().getMonth() &&
                                 eventDate.getFullYear() === new Date().getFullYear()
                        }).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">High Priority</span>
                      <span className="font-medium text-red-600">
                        {events.filter(e => e.priority === 'high').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
                    Deadline Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Deadlines can be created manually in the case manager for better case tracking and organization.
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Set reminders and track important dates</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {React.createElement(eventTypeIcons[selectedEvent.eventType], { className: "h-5 w-5" })}
                <span>{selectedEvent.title}</span>
              </DialogTitle>
              <DialogDescription>
                Event details and information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Type</Label>
                  <Badge className={`mt-1 ${eventTypeColors[selectedEvent.eventType]}`}>
                    {selectedEvent.eventType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Priority</Label>
                  <Badge
                    className="mt-1"
                    variant={selectedEvent.priority === 'high' ? 'destructive' : 
                            selectedEvent.priority === 'medium' ? 'default' : 'secondary'}
                  >
                    {selectedEvent.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Date & Time</Label>
                <p className="mt-1">
                  {formatDate(selectedEvent.startDate)} at {formatTime(selectedEvent.startDate)}
                  {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate && (
                    <> - {formatTime(selectedEvent.endDate)}</>
                  )}
                </p>
              </div>

              {selectedEvent.location && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Location</Label>
                  <p className="mt-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedEvent.location}
                  </p>
                </div>
              )}

              {selectedEvent.attendees && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Attendees</Label>
                  <p className="mt-1 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedEvent.attendees}
                  </p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="mt-1 text-gray-700">{selectedEvent.description}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
                <Button variant="destructive" onClick={() => deleteEvent(selectedEvent.id)}>
                  Delete Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}