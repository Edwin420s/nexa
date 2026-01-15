'use client'

import { useState } from 'react'
import { Save, Bell, Key, User, CreditCard, Shield, Trash2, Download } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState({
    profile: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      company: 'TechCorp',
      role: 'AI Engineer',
      bio: 'Building the future with AI agents.',
      notifications: {
        email: true,
        push: true,
        agentUpdates: true,
        projectUpdates: true,
        weeklyDigest: false
      }
    },
    api: {
      geminiApiKey: '••••••••••••••••',
      openaiApiKey: '',
      anthropicApiKey: '',
      customEndpoint: ''
    },
    billing: {
      plan: 'pro',
      monthlyLimit: 1000,
      usage: 642,
      nextBilling: '2024-02-07',
      cardLast4: '4242',
      cardExpiry: '12/25'
    },
    security: {
      twoFactor: false,
      sessionTimeout: 24,
      ipWhitelist: [],
      auditLogs: true
    }
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  const handleSave = () => {
    // Save settings to backend
    console.log('Saving settings:', settings)
  }

  const exportData = () => {
    const data = JSON.stringify(settings, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nexa-settings.json'
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
                    >
                      <Icon size={18} className={activeTab === tab.id ? 'text-blue-400' : 'text-gray-400'} />
                      <span className={activeTab === tab.id ? 'font-medium' : 'text-gray-300'}>
                        {tab.label}
                      </span>
                    </button>
                  )
                })}
              </nav>
              
              <div className="mt-8 pt-6 border-t border-gray-800">
                <button
                  onClick={exportData}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-gray-300 hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <Download size={18} />
                  <span>Export Data</span>
                </button>
                
                <button className="flex items-center space-x-2 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-2">
                  <Trash2 size={18} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={settings.profile.name}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, name: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={settings.profile.email}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Company</label>
                      <input
                        type="text"
                        value={settings.profile.company}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, company: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Role</label>
                      <input
                        type="text"
                        value={settings.profile.role}
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, role: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={settings.profile.bio}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, bio: e.target.value }
                      })}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">API Configuration</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium mb-1">Gemini API Key</h3>
                          <p className="text-sm text-gray-400">Required for all agent operations</p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          Active
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={settings.api.geminiApiKey}
                          onChange={(e) => setSettings({
                            ...settings,
                            api: { ...settings.api, geminiApiKey: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300">
                          Show
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-4">Additional APIs</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
                          <input
                            type="password"
                            value={settings.api.openaiApiKey}
                            onChange={(e) => setSettings({
                              ...settings,
                              api: { ...settings.api, openaiApiKey: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="sk-..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Anthropic API Key</label>
                          <input
                            type="password"
                            value={settings.api.anthropicApiKey}
                            onChange={(e) => setSettings({
                              ...settings,
                              api: { ...settings.api, anthropicApiKey: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="sk-ant-..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Custom Endpoint</label>
                          <input
                            type="text"
                            value={settings.api.customEndpoint}
                            onChange={(e) => setSettings({
                              ...settings,
                              api: { ...settings.api, customEndpoint: e.target.value }
                            })}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="https://api.your-service.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-6">
                  <h3 className="font-medium mb-2">API Usage Guidelines</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Keep API keys secure and never commit them to version control</li>
                    <li>• Monitor usage to avoid unexpected charges</li>
                    <li>• Rotate keys regularly for security</li>
                    <li>• Use environment variables in production</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Billing & Usage</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-blue-900/10 border border-blue-800/30 rounded-xl">
                      <h3 className="font-medium mb-4">Current Plan</h3>
                      <div className="text-3xl font-bold mb-2">Pro</div>
                      <p className="text-gray-400 mb-4">$99/month • 1000 Gemini API calls included</p>
                      <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        Upgrade Plan
                      </button>
                    </div>
                    
                    <div className="p-6 bg-purple-900/10 border border-purple-800/30 rounded-xl">
                      <h3 className="font-medium mb-4">Usage This Month</h3>
                      <div className="text-3xl font-bold mb-2">{settings.billing.usage}/1000</div>
                      <p className="text-gray-400 mb-4">API calls used</p>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 shadow-glow-purple"
                          style={{ width: `${(settings.billing.usage / 1000) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Payment Method</div>
                        <div className="text-sm text-gray-400">•••• {settings.billing.cardLast4}</div>
                      </div>
                      <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                        Update
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Next Billing Date</div>
                        <div className="text-sm text-gray-400">{settings.billing.nextBilling}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Billing History</div>
                        <div className="text-sm text-gray-400">View and download invoices</div>
                      </div>
                      <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg rounded-lg font-medium transition-all transform hover:scale-105"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}