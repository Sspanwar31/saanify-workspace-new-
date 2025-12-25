'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Minimize2, 
  Maximize2,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  suggestions?: string[]
}

interface QuickAction {
  icon: React.ReactNode
  label: string
  action: () => void
  color: string
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hello! I'm your AI assistant for Saanify. I can help you with society management, member queries, financial insights, and much more. How can I assist you today?",
      role: 'assistant',
      timestamp: new Date(),
      suggestions: [
        "How do I add a new member?",
        "Show me financial summary",
        "What are the upcoming events?",
        "Help with loan management"
      ]
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickActions: QuickAction[] = [
    {
      icon: <Users className="h-4 w-4" />,
      label: "Add Member",
      action: () => handleQuickAction("I want to add a new member to the society"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: "Financial Report",
      action: () => handleQuickAction("Show me the financial report and revenue insights"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Upcoming Events",
      action: () => handleQuickAction("What are the upcoming society events and meetings?"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Growth Analytics",
      action: () => handleQuickAction("Show me society growth analytics and member statistics"),
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleQuickAction = (action: string) => {
    setInputValue(action)
    handleSendMessage(action)
  }

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim()
    if (!messageContent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Call the AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageContent }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        suggestions: generateSuggestions(messageContent, data.response)
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    } catch (error) {
      console.error('AI API Error:', error)
      // Fallback to mock response if API fails
      setTimeout(() => {
        const aiResponse = generateAIResponse(messageContent)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse.content,
          role: 'assistant',
          timestamp: new Date(),
          suggestions: aiResponse.suggestions
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsTyping(false)
      }, 1000)
    }
  }

  const generateSuggestions = (query: string, response: string): string[] => {
    const lowerQuery = query.toLowerCase()
    const lowerResponse = response.toLowerCase()
    
    const suggestions: string[] = []
    
    if (lowerQuery.includes('member') || lowerResponse.includes('member')) {
      suggestions.push("How to bulk import members?", "What membership plans are available?", "Set up automatic reminders")
    }
    
    if (lowerQuery.includes('financial') || lowerResponse.includes('revenue') || lowerResponse.includes('financial')) {
      suggestions.push("Generate detailed financial report", "How to improve revenue collection?", "Export financial data")
    }
    
    if (lowerQuery.includes('event') || lowerResponse.includes('event')) {
      suggestions.push("Send event reminders", "Add a new event", "View event attendance report")
    }
    
    if (lowerQuery.includes('loan') || lowerResponse.includes('loan')) {
      suggestions.push("Review pending applications", "Generate loan report", "Set up automatic reminders")
    }
    
    // Default suggestions if no specific ones were added
    if (suggestions.length === 0) {
      suggestions.push("Show me all features", "How to get started guide", "Contact human support")
    }
    
    return suggestions.slice(0, 3) // Return max 3 suggestions
  }

  const generateAIResponse = (query: string): { content: string; suggestions?: string[] } => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('add member') || lowerQuery.includes('new member')) {
      return {
        content: "📝 To add a new member to your society:\n\n1. Navigate to the **Members** section in your dashboard\n2. Click on **'Add New Member'** button\n3. Fill in the required details:\n   - Full name and contact information\n   - Membership type and plan\n   - Initial deposit details\n4. Review and confirm the information\n5. The member will be added instantly!\n\n💡 **Pro tip**: You can also bulk import members using our CSV import feature for faster onboarding.",
        suggestions: [
          "How to bulk import members?",
          "What membership plans are available?",
          "Set up automatic reminders"
        ]
      }
    }
    
    if (lowerQuery.includes('financial') || lowerQuery.includes('revenue') || lowerQuery.includes('report')) {
      return {
        content: "📊 Your Financial Summary:\n\n**Current Month Performance:**\n• Total Revenue: ₹2,45,000 (+12% vs last month)\n• Active Members: 156 (98% retention rate)\n• Pending Dues: ₹18,500 (7.5% of total)\n• Loan Disbursed: ₹3,20,000\n\n**Key Insights:**\n✅ Revenue growth of 12% month-over-month\n✅ High member retention rate\n⚠️ Focus on collecting pending dues\n\nWould you like me to generate a detailed financial report or help you optimize revenue collection?",
        suggestions: [
          "Generate detailed financial report",
          "How to improve revenue collection?",
          "Export financial data"
        ]
      }
    }
    
    if (lowerQuery.includes('event') || lowerQuery.includes('meeting')) {
      return {
        content: "📅 Upcoming Society Events:\n\n**This Week:**\n• **Monday** - Society Meeting (7:00 PM)\n• **Wednesday** - Maintenance Inspection (10:00 AM)\n• **Friday** - Cultural Event - Diwali Celebration (6:00 PM)\n\n**Next Week:**\n• **Tuesday** - Annual General Meeting (10:00 AM)\n• **Saturday** - Community Cleanup Drive (8:00 AM)\n\n🎉 **Participation Rate:** 78% average attendance\n\nWould you like to send reminders to members or add a new event?",
        suggestions: [
          "Send event reminders",
          "Add a new event",
          "View event attendance report"
        ]
      }
    }
    
    if (lowerQuery.includes('loan') || lowerQuery.includes('lending')) {
      return {
        content: "💰 Loan Management Overview:\n\n**Active Loans:** 24 loans worth ₹3,20,000\n**Pending Approvals:** 3 applications\n**Recovery Rate:** 94% (excellent performance)\n\n**Quick Actions Available:**\n• Approve pending loan applications\n• Generate repayment schedules\n• Send payment reminders\n• View loan performance analytics\n\n**Popular Loan Types:**\n- Personal Emergency Loans (45%)\n- Home Improvement Loans (30%)\n- Education Loans (25%)\n\nHow can I help you with loan management today?",
        suggestions: [
          "Review pending applications",
          "Generate loan report",
          "Set up automatic reminders"
        ]
      }
    }
    
    // Default response
    return {
      content: "🤔 I understand you're asking about: \"" + query + "\"\n\nI can help you with:\n• Member management and onboarding\n• Financial reports and analytics\n• Event scheduling and management\n• Loan processing and tracking\n• Society governance and compliance\n• Communication with members\n\nCould you please provide more details about what specific aspect you'd like help with?",
      suggestions: [
        "Show me all features",
        "How to get started guide",
        "Contact human support"
      ]
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse" />
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw]"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-background/95 backdrop-blur-sm border-2 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-6 w-6" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs opacity-90">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="h-96 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white ml-2' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white mr-2'
                      }`}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        {message.suggestions && (
                          <div className="mt-2 space-y-1">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleQuickAction(suggestion)}
                                className="block w-full text-left text-xs p-2 rounded bg-background/50 hover:bg-background/70 transition-colors"
                              >
                                💡 {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-75" />
                          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-150" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t">
              <div className="grid grid-cols-4 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={action.action}
                    className={`h-auto p-2 flex flex-col items-center gap-1 text-xs ${action.color} text-white hover:scale-105 transition-transform`}
                  >
                    {action.icon}
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about society management..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  )
}