'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getActiveCalls } from '@/lib/api-interceptor'
import { Activity, CheckCircle, Loader2 } from 'lucide-react'

export default function ApiStatusMonitor() {
  const [activeCalls, setActiveCalls] = useState<any[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const calls = getActiveCalls()
      setActiveCalls(calls)
    }, 500) // Update every 500ms

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2"
      >
        <Activity className="w-4 h-4" />
        API Status
        {activeCalls.length > 0 && (
          <Badge variant="destructive" className="ml-1">
            {activeCalls.length}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              API Status Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              {activeCalls.length > 0 ? (
                <Badge variant="destructive" className="animate-pulse">
                  {activeCalls.length} Active
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Idle
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeCalls.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-sm">कोई API call active नहीं है</div>
            </div>
          ) : (
            activeCalls.map((call, index) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">
                      {call.method} {call.url.split('/').pop() || call.url}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {call.url}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {call.duration}ms
                </Badge>
              </div>
            ))
          )}
          
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>📡 Real-time API tracking enabled</span>
              <span>✅ All calls monitored</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}