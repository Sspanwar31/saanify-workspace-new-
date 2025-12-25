"use client"

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)

  const connect = () => {
    if (socketRef.current?.connected) return

    setConnectionStatus('connecting')
    
    try {
      // For now, disable WebSocket to prevent connection errors
      // TODO: Implement proper WebSocket server setup
      setConnectionStatus('error')
      return
      
      // Original WebSocket connection code (commented out)
      /*
      socketRef.current = io(process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://127.0.0.1:3000', {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: reconnectAttempts,
        reconnectionDelay: reconnectDelay
      })
      */

      socketRef.current.on('connect', () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        console.log('WebSocket connected')
      })

      socketRef.current.on('disconnect', (reason) => {
        setIsConnected(false)
        setConnectionStatus('disconnected')
        console.log('WebSocket disconnected:', reason)
      })

      socketRef.current.on('connect_error', (error) => {
        setConnectionStatus('error')
        console.error('WebSocket connection error:', error)
        
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, reconnectDelay * reconnectAttemptsRef.current)
        }
      })

      socketRef.current.on('notification', (data) => {
        const message: WebSocketMessage = {
          type: 'notification',
          data,
          timestamp: new Date()
        }
        setMessages(prev => [...prev.slice(-49), message])
      })

      socketRef.current.on('client_update', (data) => {
        const message: WebSocketMessage = {
          type: 'client_update',
          data,
          timestamp: new Date()
        }
        setMessages(prev => [...prev.slice(-49), message])
      })

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }

  const sendMessage = (type: string, data: any) => {
    // WebSocket disabled - return false for now
    // TODO: Implement proper WebSocket server setup
    return false
    
    // Original code (commented out)
    /*
    if (socketRef.current?.connected) {
      socketRef.current.emit(type, data)
      return true
    }
    return false
    */
  }

  const clearMessages = () => {
    setMessages([])
  }

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect])

  return {
    isConnected,
    connectionStatus,
    messages,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    socket: socketRef.current
  }
}