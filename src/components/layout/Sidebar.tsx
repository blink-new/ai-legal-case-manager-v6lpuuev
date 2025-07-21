import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Scale,
  Users,
  Calendar,
  Bell
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Cases', icon: FolderOpen },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'negotiator', label: 'AI Negotiator', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Scale className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-semibold text-gray-900">LegalAI</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start text-left',
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-white">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">Attorney</p>
          </div>
        </div>
      </div>
    </div>
  )
}