'use client'

import { useState, useEffect } from 'react'
import { Users, MessageSquare, GitBranch, GitMerge, Zap, Target, Cpu, Send, Paperclip, Mic, Video } from 'lucide-react'

interface AgentMessage {
  id: string
  agent: string
  content: string
  timestamp: string
  type: 'message' | 'code' | 'data' | 'decision'
  confidence: number
  reactions?: { emoji: string; count: number }[]
}

interface AgentCollaboration {
  id: string
  name: string
  agents: string[]
  topic: string
  messages: AgentMessage[]
  decisions: string[]
  status: 'active' | 'paused' | 'completed'
}

interface MultiAgentCollaborationProps {
  collaborationId?: string
  onMessageSend?: (content: string, type: AgentMessage['type']) => void
}

export default function MultiAgentCollaboration({ collaborationId, onMessageSend }: MultiAgentCollaborationProps) {
  const [collaboration, setCollaboration] = useState<AgentCollaboration>({
    id: 'collab-1',
    name: 'Research Project Planning',
    agents: ['Researcher', 'Architect', 'Builder', 'Reviewer', 'Optimizer'],
    topic: 'Designing autonomous research agent system',
    status: 'active',
    decisions: [
      'Use Gemini 3 Pro for planning tasks',
      'Implement multi-agent orchestration',
      'Add real-time confidence scoring',
      'Create modular agent architecture'
    ],
    messages: [
      {
        id: 'msg-1',
        agent: 'Researcher',
        content: 'I\'ve analyzed the requirements and suggest we use a multi-agent approach with specialized roles.',
        timestamp: '2024-01-07T10:00:00Z',
        type: 'message',
        confidence: 0.92,
        reactions: [{ emoji: '👍', count: 3 }, { emoji: '👏', count: 2 }]
      },
      {
        id: 'msg-2',
        agent: 'Architect',
        content: 'Here\'s my proposed architecture:\n```json\n{\n  "orchestrator": "central coordinator",\n  "agents": ["researcher", "architect", "builder", "reviewer"],\n  "communication": "message passing"\n}\n```',
        timestamp: '2024-01-07T10:05:00Z',
        type: 'code',
        confidence: 0.88
      },
      {
        id: 'msg-3',
        agent: 'Builder',
        content: 'I can implement this using Node.js and the Gemini API. Need confirmation on the tech stack.',
        timestamp: '2024-01-07T10:10:00Z',
        type: 'message',
        confidence: 0.85
      },
      {
        id: 'msg-4',
        agent: 'Reviewer',
        content: 'The architecture looks good but we should add error handling and retry mechanisms.',
        timestamp: '2024-01-07T10:15:00Z',
        type: 'decision',
        confidence: 0.90,
        reactions: [{ emoji: '✅', count: 4 }]
      },
      {
        id: 'msg-5',
        agent: 'Optimizer',
        content: 'Based on cost analysis, recommend using Gemini 2.5 Flash for non-critical tasks to reduce costs by 40%.',
        timestamp: '2024-01-07T10:20:00Z',
        type: 'data',
        confidence: 0.95
      }
    ]
  })

  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<AgentMessage['type']>('message')
  const [activeAgent, setActiveAgent] = useState('User')
  const [isTyping, setIsTyping] = useState(false)

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      agent: activeAgent,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: messageType,
      confidence: 0.85
    }

    setCollaboration(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }))

    onMessageSend?.(newMessage, messageType)
    setNewMessage('')
  }

  const addReaction = (messageId: string, emoji: string) => {
    setCollaboration(prev => ({
      ...prev,
      messages: prev.messages.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find(r => r.emoji === emoji)
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions?.map(r => 
                r.emoji === emoji ? { ...r, count: r.count + 1 } : r
              )
            }
          } else {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji, count: 1 }]
            }
          }
        }
        return msg
      })
    }))
  }

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'Researcher': 'bg-blue-500',
      'Architect': 'bg-purple-500',
      'Builder': 'bg-green-500',
      'Reviewer': 'bg-yellow-500',
      'Optimizer': 'bg-pink-500',
      'User': 'bg-gray-500'
    }
    return colors[agent] || 'bg-gray-500'
  }

  const getMessageTypeIcon = (type: AgentMessage['type']) => {
    switch (type) {
      case 'code': return '💻'
      case 'data': return '📊'
      case 'decision': return '✅'
      default: return '💬'
    }
  }

  // Simulate agent responses
  useEffect(() => {
    if (collaboration.messages.length === 0) return

    const lastMessage = collaboration.messages[collaboration.messages.length - 1]
    if (lastMessage.agent === 'User') {
      setIsTyping(true)
      
      const responses = [
        'Interesting point. Let me analyze that further...',
        'Based on my research, I suggest...',
        'I can help implement that. Here\'s my approach...',
        'Great suggestion! I\'ll review and provide feedback...',
        'From a cost optimization perspective...'
      ]

      const agents = ['Researcher', 'Architect', 'Builder', 'Reviewer', 'Optimizer']
      const respondingAgent = agents[Math.floor(Math.random() * agents.length)]

      setTimeout(() => {
        const response: AgentMessage = {
          id: `msg-${Date.now()}`,
          agent: respondingAgent,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString(),
          type: 'message',
          confidence: 0.8 + Math.random() * 0.15
        }

        setCollaboration(prev => ({
          ...prev,
          messages: [...prev.messages, response]
        }))

        setIsTyping(false)
      }, 2000)
    }
  }, [collaboration.messages])

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Users className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Multi-Agent Collaboration</h3>
            <p className="text-sm text-gray-400">Real-time agent communication and decision making</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold">{collaboration.messages.length}</div>
            <div className="text-sm text-gray-400">Messages</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{collaboration.decisions.length}</div>
            <div className="text-sm text-gray-400">Decisions</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Agents & Decisions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Agents */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h4 className="font-medium mb-4">Active Agents</h4>
            <div className="space-y-3">
              {collaboration.agents.map((agent, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${getAgentColor(agent)} flex items-center justify-center text-white font-bold`}>
                      {agent.charAt(0)}
                    </div>
                    <span className="font-medium">{agent}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${idx < 3 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-sm text-gray-400">
                      {idx < 3 ? 'Online' : 'Standby'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decisions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h4 className="font-medium mb-4">Key Decisions</h4>
            <div className="space-y-3">
              {collaboration.decisions.map((decision, idx) => (
                <div key={idx} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-1 flex-shrink-0">
                      <Target size={12} className="text-green-400" />
                    </div>
                    <span className="text-sm text-gray-300">{decision}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4">
                      <button className="text-sm text-gray-400 hover:text-gray-300">
                        👍 3
                      </button>
                      <button className="text-sm text-gray-400 hover:text-gray-300">
                        👎 0
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">
                      {idx === 0 ? 'Just now' : `${idx * 5} min ago`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collaboration Stats */}
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/30 rounded-xl p-5">
            <h4 className="font-medium mb-4">Collaboration Stats</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Agent Participation</span>
                  <span className="font-medium">100%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Decision Quality</span>
                  <span className="font-medium text-green-400">92%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="w-11/12 h-full bg-gradient-to-r from-green-500 to-emerald-500" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Consensus Rate</span>
                  <span className="font-medium">85%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="w-4/5 h-full bg-gradient-to-r from-yellow-500 to-orange-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-gray-800 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{collaboration.name}</h4>
                  <p className="text-sm text-gray-400">{collaboration.topic}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <Video size={18} />
                  </button>
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <Mic size={18} />
                  </button>
                  <span className={`px-3 py-1 rounded-full text-sm ${collaboration.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {collaboration.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {collaboration.messages.map((message) => (
                <div key={message.id} className={`flex ${message.agent === 'User' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.agent === 'User' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-end space-x-2 ${message.agent === 'User' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full ${getAgentColor(message.agent)} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {message.agent.charAt(0)}
                      </div>
                      
                      <div>
                        <div className={`px-4 py-3 rounded-2xl ${message.agent === 'User' ? 'bg-blue-500/20 text-blue-100 rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none'}`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">{message.agent}</span>
                            <span className="text-xs text-gray-400">
                              {getMessageTypeIcon(message.type)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {(message.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          
                          {message.type === 'code' ? (
                            <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-900/50 p-3 rounded-lg">
                              {message.content}
                            </pre>
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                          
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        
                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-2 ${message.agent === 'User' ? 'justify-end' : 'justify-start'}`}>
                            {message.reactions.map((reaction, idx) => (
                              <button
                                key={idx}
                                onClick={() => addReaction(message.id, reaction.emoji)}
                                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                              >
                                {reaction.emoji} {reaction.count}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div className="px-4 py-3 bg-gray-800 rounded-2xl rounded-bl-none">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center space-x-4 mb-3">
                <select
                  value={activeAgent}
                  onChange={(e) => setActiveAgent(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="User">User</option>
                  {collaboration.agents.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
                
                <div className="flex items-center space-x-2">
                  {(['message', 'code', 'data', 'decision'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMessageType(type)}
                      className={`px-3 py-1.5 rounded text-sm ${messageType === type ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                    >
                      {getMessageTypeIcon(type)} {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type your message... (Shift+Enter for new line)"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 resize-none h-20"
                  />
                  <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                    <button className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                      <Paperclip size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                      <Zap size={16} />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                >
                  <Send size={20} />
                </button>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                Agents will respond automatically. Use @mention to direct messages to specific agents.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}