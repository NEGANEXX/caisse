"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Plus, Check, X, Shield, ShieldAlert, Key, Users } from "lucide-react"

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [pinRequests, setPinRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  // New User Form State
  const [newName, setNewName] = useState("")
  const [newPin, setNewPin] = useState("")
  const [newRole, setNewRole] = useState<"Staff" | "Manager">("Staff")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersData, requestsData] = await Promise.all([
        supabase.from('users').select('*').order('name'),
        supabase.from('pin_change_requests').select('*, users(name, role)').eq('status', 'pending').order('created_at', { ascending: false })
      ])
      
      if (usersData.data) setUsers(usersData.data)
      if (requestsData.data) setPinRequests(requestsData.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newPin || newPin.length < 4) {
      alert("Name and a valid PIN (min 4 digits) are required.")
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase.from('users').insert({
        name: newName,
        pin: newPin,
        role: newRole
      })

      if (error) {
        if (error.code === '23505') {
          alert("PIN already exists. Please choose a unique PIN.")
        } else {
          throw error
        }
      } else {
        setNewName("")
        setNewPin("")
        setNewRole("Staff")
        
        // Log the action
        const managerId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
        await supabase.from('action_logs').insert({
          user_id: managerId,
          action_type: 'create_user',
          description: `Created user ${newName} (${newRole})`
        })

        fetchData()
      }
    } catch (err: any) {
      alert("Error creating user: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePinRequest = async (requestId: string, userId: string, newPin: string, status: 'approved' | 'rejected') => {
    setActionLoading(true)
    try {
      const managerId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]

      // Update the request status
      await supabase.from('pin_change_requests').update({ status }).eq('id', requestId)

      if (status === 'approved') {
        // Update user's pin
        await supabase.from('users').update({ pin: newPin }).eq('id', userId)
      }

      // Log the action
      const user = users.find(u => u.id === userId)
      await supabase.from('action_logs').insert({
        user_id: managerId,
        action_type: `pin_${status}`,
        description: `${status === 'approved' ? 'Approved' : 'Rejected'} PIN change for ${user?.name || 'Unknown'}`
      })

      fetchData()
    } catch (err: any) {
      alert(`Error ${status} request: ` + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manage Users</h1>
        <p className="text-slate-500 mt-1">Create new accounts and manage PIN change requests.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main User List & Creation Form */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-primary" />
                  Add New User
                </h3>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code (Unique)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newPin}
                        onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="e.g. 5678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input type="radio" value="Staff" checked={newRole === "Staff"} onChange={() => setNewRole("Staff")} className="mr-2" />
                        <span className="text-slate-700">Staff</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" value="Manager" checked={newRole === "Manager"} onChange={() => setNewRole("Manager")} className="mr-2" />
                        <span className="text-slate-700">Manager</span>
                      </label>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-slate-500" />
                  All Users
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">PIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${u.role === 'Manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role === 'Manager' ? <Shield className="inline w-3 h-3 mr-1"/> : null}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono tracking-widest">{u.pin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Pending PIN Requests */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-200 bg-amber-50">
                <h3 className="font-bold text-amber-800 flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2" />
                  Pending PIN Changes
                  {pinRequests.length > 0 && (
                    <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{pinRequests.length}</span>
                  )}
                </h3>
              </div>
              <ul className="divide-y divide-amber-100">
                {pinRequests.map(req => (
                  <li key={req.id} className="p-4 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="font-semibold text-slate-800">{req.users?.name}</div>
                        <div className="text-sm text-slate-500 flex items-center mt-1">
                          <Key className="w-3 h-3 mr-1" /> New PIN: <span className="font-mono bg-white px-1 border border-slate-200 rounded ml-1">{req.new_pin}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePinRequest(req.id, req.user_id, req.new_pin, 'approved')}
                          disabled={actionLoading}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-1.5 rounded flex justify-center items-center disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </button>
                        <button 
                          onClick={() => handlePinRequest(req.id, req.user_id, req.new_pin, 'rejected')}
                          disabled={actionLoading}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium py-1.5 rounded flex justify-center items-center disabled:opacity-50"
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {pinRequests.length === 0 && (
                  <li className="p-6 text-slate-400 text-center text-sm">
                    No pending requests.
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
