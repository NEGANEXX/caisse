"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Key, Clock, ShieldCheck } from "lucide-react"

export default function StaffSettingsPage() {
  const [newPin, setNewPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })
  const [pendingRequest, setPendingRequest] = useState<any>(null)

  useEffect(() => {
    checkPendingRequest()
  }, [])

  const checkPendingRequest = async () => {
    try {
      const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
      if (!staffId) return

      const { data, error } = await supabase
        .from('pin_change_requests')
        .select('*')
        .eq('user_id', staffId)
        .eq('status', 'pending')
        .single()

      if (data) {
        setPendingRequest(data)
      } else {
        setPendingRequest(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRequestPinChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPin || newPin.length < 4) {
      setMessage({ text: "PIN must be at least 4 digits.", type: "error" })
      return
    }

    setLoading(true)
    setMessage({ text: "", type: "" })

    try {
      const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
      
      const { error } = await supabase.from('pin_change_requests').insert({
        user_id: staffId,
        new_pin: newPin,
        status: 'pending'
      })

      if (error) throw error

      setMessage({ text: "PIN change request sent to the manager. Please wait for approval.", type: "success" })
      setNewPin("")
      checkPendingRequest()
      
    } catch (err: any) {
      setMessage({ text: "Error requesting PIN change: " + err.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your security and preferences.</p>
      </div>

      {pendingRequest ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl shadow-sm text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-amber-800 mb-2">PIN Change Request Pending</h3>
          <p className="text-amber-700 mb-4">
            You have already requested to change your PIN to <span className="font-mono bg-white px-2 py-1 rounded border border-amber-200">{pendingRequest.new_pin}</span>. 
            <br/>Please wait for the Manager to approve it.
          </p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="bg-slate-100 p-3 rounded-full mr-4">
              <Key className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Change PIN Code</h3>
              <p className="text-sm text-slate-500">Request a new PIN code. This requires manager approval.</p>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-lg font-medium mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleRequestPinChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New PIN Code</label>
              <input 
                type="password" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-xl tracking-widest font-mono"
                placeholder="Enter new digits"
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-green-500" /> 
                Only numbers are allowed. Minimum 4 digits.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={loading || !newPin || newPin.length < 4}
                className="w-full flex justify-center items-center px-4 py-3 bg-primary text-white font-bold rounded-lg shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                {loading ? "Submitting..." : "Request PIN Change"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
