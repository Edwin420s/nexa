'use client'

import { useState } from 'react'
import { Users, UserPlus, MessageSquare, Share2, Bell, Lock, Globe, Mail } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'online' | 'offline' | 'away'
  avatar?: string
  lastActive?: string
}

interface ProjectInvite {
  id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  status: 'pending' | 'accepted' | 'expired'
  invitedAt: string
  invitedBy: string
}

interface TeamCollaborationProps {
  projectId: string
  members: TeamMember[]
  invites: ProjectInvite[]
  onInvite: (email: string, role: TeamMember['role']) => void
  onRemoveMember: (memberId: string) => void
  onUpdateRole: (memberId: string, role: TeamMember['role']) => void
}

export default function TeamCollaboration({
  projectId,
  members,
  invites,
  onInvite,
  onRemoveMember,
  onUpdateRole
}: TeamCollaborationProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('member')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'settings'>('members')

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-500/20 text-purple-400'
      case 'admin': return 'bg-blue-500/20 text-blue-400'
      case 'member': return 'bg-green-500/20 text-green-400'
      case 'viewer': return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-500'
    }
  }

  const handleInvite = () => {
    if (inviteEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      onInvite(inviteEmail, inviteRole)
      setInviteEmail('')
      setShowInviteForm(false)
    }
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/projects/${projectId}/join`
    navigator.clipboard.writeText(link)
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Users className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Team Collaboration</h3>
            <p className="text-sm text-gray-400">Manage team members and permissions</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform hover:scale-105"
        >
          <UserPlus size={18} />
          <span>Invite People</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-3 font-medium ${activeTab === 'members' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`px-4 py-3 font-medium ${activeTab === 'invites' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Invites ({invites.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 font-medium ${activeTab === 'settings' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Settings
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Invite to Project</h4>
            <button
              onClick={() => setShowInviteForm(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="team@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <div className="grid grid-cols-4 gap-2">
                {(['viewer', 'member', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setInviteRole(role)}
                    className={`p-3 text-center rounded-lg border transition-colors ${inviteRole === role ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700'}`}
                  >
                    <div className="text-sm font-medium capitalize">{role}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {role === 'viewer' && 'View only'}
                      {role === 'member' && 'Can edit'}
                      {role === 'admin' && 'Full access'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div 
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${getStatusColor(member.status)}`}
                  />
                </div>
                
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-gray-400">{member.email}</div>
                  {member.lastActive && (
                    <div className="text-xs text-gray-500">
                      Last active: {new Date(member.lastActive).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={member.role}
                  onChange={(e) => onUpdateRole(member.id, e.target.value as TeamMember['role'])}
                  disabled={member.role === 'owner'}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                
                {member.role !== 'owner' && (
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
                
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <MessageSquare size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
          
          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>No team members yet. Invite people to collaborate.</p>
            </div>
          )}
        </div>
      )}

      {/* Invites Tab */}
      {activeTab === 'invites' && (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-800 rounded-lg"
            >
              <div>
                <div className="font-medium">{invite.email}</div>
                <div className="text-sm text-gray-400">
                  Invited by {invite.invitedBy} • {new Date(invite.invitedAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${invite.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                  {invite.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(invite.role)}`}>
                  {invite.role}
                </span>
              </div>
            </div>
          ))}
          
          {invites.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>No pending invites.</p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Project Access</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Lock size={20} className="text-gray-400" />
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-gray-400">Only invited members can access</div>
                  </div>
                </div>
                <input type="radio" name="access" defaultChecked className="w-5 h-5" />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Globe size={20} className="text-gray-400" />
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-gray-400">Anyone with the link can view</div>
                  </div>
                </div>
                <input type="radio" name="access" className="w-5 h-5" />
              </label>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Share Options</h4>
            <div className="p-4 bg-gray-800/30 border border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">Shareable Link</div>
                  <div className="text-sm text-gray-400">Anyone with this link can view the project</div>
                </div>
                <button
                  onClick={copyInviteLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Share2 size={16} />
                  <span>Copy Link</span>
                </button>
              </div>
              <div className="text-sm text-gray-400 font-mono p-2 bg-gray-900 rounded">
                {window.location.origin}/projects/{projectId}/join
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Notifications</h4>
            <div className="space-y-3">
              {[
                { label: 'Agent updates', description: 'When agents complete tasks or encounter errors' },
                { label: 'Team activity', description: 'When team members make changes' },
                { label: 'Project milestones', description: 'When major milestones are reached' },
                { label: 'System alerts', description: 'Important system notifications' }
              ].map((item) => (
                <label key={item.label} className="flex items-center justify-between p-3 bg-gray-800/30 border border-gray-800 rounded-lg hover:border-gray-700">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-400">{item.description}</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}