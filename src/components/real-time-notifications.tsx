"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCircle, AlertTriangle, Info, Zap, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useWebSocket } from '@/hooks/use-websocket'
import { format } from 'date-fns'

interface NotificationItem {
  id: string
  type: 'notification' | 'client_update' | 'system_alert'
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

const notificationIcons = {
  notification: Bell,
  client_update: Users,
  system_alert: Zap
}

const notificationColors = {
  notification: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  client_update: 'bg-green-500/20 text-green-300 border-green-500/30',
  system_alert: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { messages, isConnected, sendMessage } = useWebSocket()

  useEffect(() => {
    const newNotifications = messages.map(msg => ({
      id: `${msg.type}-${msg.timestamp.getTime()}`,
      type: msg.type as 'notification' | 'client_update' | 'system_alert',
      title: getNotificationTitle(msg.type, msg.data),
      message: getNotificationMessage(msg.type, msg.data),
      timestamp: msg.timestamp,
      read: false,
      data: msg.data
    }))

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 50))
      setUnreadCount(prev => prev + newNotifications.length)
    }
  }, [messages])

  const getNotificationTitle = (type: string, data: any) => {
    switch (type) {
      case 'notification':
        return data.title || 'New Notification'
      case 'client_update':
        return `Client Update: ${data.clientName || 'Unknown'}`
      case 'system_alert':
        return `System Alert: ${data.alertType || 'General'}`
      default:
        return 'New Update'
    }
  }

  const getNotificationMessage = (type: string, data: any) => {
    switch (type) {
      case 'notification':
        return data.message || 'You have a new notification'
      case 'client_update':
        return `${data.action || 'Updated'} - ${data.details || 'No details'}`
      case 'system_alert':
        return data.message || 'System notification'
      default:
        return 'New system update'
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (!notifications.find(n => n.id === id)?.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const testNotification = () => {
    sendMessage('test_notification', {
      title: 'Test Notification',
      message: 'This is a test notification from the system',
      timestamp: new Date()
    })
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-300 hover:text-white hover:bg-slate-700/50"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center p-0">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Connection Status Indicator */}
      <div className="absolute -top-2 -right-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
      </div>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-96 z-50"
          >
            <Card className="bg-slate-800 border-slate-700 shadow-xl">
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-white font-medium">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                        {unreadCount} unread
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-gray-400 hover:text-white h-8 px-2"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-white h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No notifications yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testNotification}
                        className="mt-4 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                      >
                        Send Test Notification
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {notifications.map((notification) => {
                        const Icon = notificationIcons[notification.type]
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-4 hover:bg-slate-700/30 transition-colors ${
                              !notification.read ? 'bg-slate-700/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${notificationColors[notification.type]}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-white font-medium text-sm">
                                      {notification.title}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">
                                      {format(notification.timestamp, 'MMM d, h:mm a')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!notification.read && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead(notification.id)}
                                        className="text-gray-400 hover:text-white h-6 w-6 p-0"
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => clearNotification(notification.id)}
                                      className="text-gray-400 hover:text-red-400 h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="text-gray-400 hover:text-red-400 h-8 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}