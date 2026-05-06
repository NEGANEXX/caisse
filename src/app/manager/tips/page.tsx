"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Calendar, Download, RefreshCw, ZoomIn, X, Coins } from "lucide-react"

export default function ManagerTipsPage() {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  
  // Modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Tips
      const { data: tipsData, error: tipsError } = await supabase
        .from('tips_reports')
        .select(`
          *,
          users!tips_reports_staff_id_fkey (name)
        `)
        .eq('report_date', filterDate)

      if (tipsError) throw tipsError
      setReports(tipsData || [])

    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterDate])

  const totalTips = reports.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tips Reports</h1>
          <p className="text-slate-500 mt-1">Review staff tips for the selected date.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Calendar className="w-5 h-5 text-slate-400 ml-2" />
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border-none outline-none bg-transparent text-slate-700 font-medium px-2 py-1"
          />
          <button 
            onClick={fetchData}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Coins className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Tips Declared</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalTips.toFixed(2)} <span className="text-sm font-normal text-slate-500">MAD</span></h3>
          </div>
        </div>
      </div>

      {/* Tips Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Individual Tips Reports</h3>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No tips reported for this date.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((report) => (
                <div key={report.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {report.users?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900">{report.users?.name || 'Unknown Staff'}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-slate-500">Amount</p>
                      <p className="text-xl font-bold text-slate-800">{Number(report.amount).toFixed(2)} MAD</p>
                    </div>
                  </div>
                  
                  {report.proof_image_url && (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 h-32 w-48 flex-shrink-0 cursor-pointer" onClick={() => setSelectedImage(report.proof_image_url)}>
                      <img 
                        src={report.proof_image_url} 
                        alt="Proof" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="text-white w-8 h-8" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Expanded proof" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4">
              <a 
                href={selectedImage}
                target="_blank"
                rel="noreferrer"
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4 mr-2" />
                Open Original File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
