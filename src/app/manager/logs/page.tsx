"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Calendar as CalendarIcon, Clock, User, Activity } from "lucide-react"

export default function ActionLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchLogs()
  }, [date])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Fetch logs for the selected date
      // We assume timezone issues might happen, so we just do a simple string match or date cast
      // For simplicity in this demo, we'll fetch the last 100 logs or filter by date
      
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('action_logs')
        .select('*, users(name, role)')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setLogs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getActionColor = (type: string) => {
    if (type === 'login') return 'bg-green-100 text-green-800'
    if (type === 'logout') return 'bg-slate-200 text-slate-800'
    if (type.includes('pin_approved')) return 'bg-blue-100 text-blue-800'
    if (type.includes('pin_rejected')) return 'bg-red-100 text-red-800'
    if (type === 'create_user') return 'bg-purple-100 text-purple-800'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Logs</h1>
          <p className="text-slate-500 mt-1">View user activity and system events.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm">
            <CalendarIcon className="w-5 h-5 text-slate-400 mr-2" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="outline-none text-slate-700 font-medium bg-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 flex items-center"><Clock className="w-4 h-4 mr-1"/> Time</th>
                  <th className="px-6 py-4"><div className="flex items-center"><User className="w-4 h-4 mr-1"/> User</div></th>
                  <th className="px-6 py-4"><div className="flex items-center"><Activity className="w-4 h-4 mr-1"/> Action</div></th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {log.users?.name || 'Unknown'}
                      <span className="ml-2 text-xs font-normal text-slate-400">({log.users?.role || 'Deleted'})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${getActionColor(log.action_type)}`}>
                        {log.action_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {log.description}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Activity className="w-8 h-8 text-slate-300 mb-2" />
                        <p>No activity logs found for this date.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
