"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Download, Calendar as CalendarIcon, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import JSZip from "jszip"
import { saveAs } from "file-saver"

function CashReportItem({ r }: { r: any }) {
  const [expanded, setExpanded] = useState(false)

  const renderBreakdown = (currency: string, data: any) => {
    if (!data) return null
    const keys = Object.keys(data).filter(k => data[k] > 0)
    if (keys.length === 0) return null

    return (
      <div className="mt-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase">{currency} Breakdown</h4>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {keys.map(k => (
            <div key={k} className="text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded">
              <span className="font-semibold">{data[k]}</span> x {k} {currency}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <li className="p-6 hover:bg-slate-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-slate-800">{r.users?.name || 'Unknown'}</span>
        <span className={`px-2 py-1 rounded text-xs font-bold ${r.difference === 0 ? 'bg-slate-100 text-slate-600' : r.difference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          Diff: {r.difference > 0 ? '+' : ''}{r.difference}
        </span>
      </div>
      <div className="text-sm text-slate-600 flex justify-between mb-4">
        <span>System: {r.system_amount}</span>
        <span className="font-medium text-slate-900">Actual: {r.actual_amount}</span>
      </div>
      
      <div className="flex gap-4">
        {r.system_report_image_url && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Restaurant</span>
            <a href={r.system_report_image_url} target="_blank" rel="noopener noreferrer" className="shrink-0 block w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
              <img src={r.system_report_image_url} alt="Restaurant Report" className="w-full h-full object-cover" />
            </a>
          </div>
        )}
        {r.actual_report_image_url && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Snack</span>
            <a href={r.actual_report_image_url} target="_blank" rel="noopener noreferrer" className="shrink-0 block w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
              <img src={r.actual_report_image_url} alt="Snack Report" className="w-full h-full object-cover" />
            </a>
          </div>
        )}
        <div className="flex-1 flex flex-col justify-end items-end">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 px-3 py-1.5 rounded-md"
          >
            {expanded ? "Hide Details" : "See More"}
            {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {renderBreakdown('MAD', r.breakdown_mad)}
          {renderBreakdown('USD', r.breakdown_usd)}
          {renderBreakdown('EUR', r.breakdown_eur)}
          
          {(!r.breakdown_mad && !r.breakdown_usd && !r.breakdown_eur) && (
            <div className="text-sm text-slate-500 italic">No breakdown details available.</div>
          )}
        </div>
      )}
    </li>
  )
}

export default function ManagerDashboard() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [reports, setReports] = useState<any>({ cash: [], tpe: [], gratuite: [], dppc: [], images: [] })
  const [loading, setLoading] = useState(false)
  const [zipping, setZipping] = useState(false)

  useEffect(() => {
    fetchData()
  }, [date])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [cash, tpe, gratuite, dppc, images] = await Promise.all([
        supabase.from('cash_reports').select('*, users(name)').eq('report_date', date),
        supabase.from('tpe_reports').select('*, users(name)').eq('report_date', date),
        supabase.from('gratuite_reports').select('*, users(name)').eq('report_date', date),
        supabase.from('dp_pc_reports').select('*, users(name)').eq('report_date', date),
        supabase.from('receipt_images').select('*, users(name)').eq('report_date', date)
      ])

      setReports({
        cash: cash.data || [],
        tpe: tpe.data || [],
        gratuite: gratuite.data || [],
        dppc: dppc.data || [],
        images: images.data || []
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleZipDownload = async () => {
    if (reports.images.length === 0) return

    setZipping(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder(`Receipts_${date}`)

      for (let i = 0; i < reports.images.length; i++) {
        const img = reports.images[i]
        try {
          const response = await fetch(img.file_url)
          const blob = await response.blob()
          const ext = img.file_path.split('.').pop()
          const staffName = img.users?.name?.replace(/\s+/g, '_') || 'Staff'
          folder?.file(`${staffName}_${i+1}.${ext}`, blob)
        } catch (e) {
          console.error("Error fetching image", img.file_url, e)
        }
      }

      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `Daily_Receipts_${date}.zip`)
    } catch (err) {
      console.error("Error creating zip", err)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manager Dashboard</h1>
          <p className="text-slate-500 mt-1">Review daily reports and download receipts.</p>
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
          <button 
            onClick={handleZipDownload}
            disabled={zipping || reports.images.length === 0}
            className="flex items-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {zipping ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
            {zipping ? "Zipping..." : `ZIP Receipts (${reports.images.length})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 mb-4">Total Cash Declared</h3>
              <div className="text-3xl font-bold text-slate-800">
                {reports.cash.reduce((acc: number, curr: any) => acc + curr.actual_amount, 0).toFixed(2)} MAD
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 mb-4">Total TPE Declared</h3>
              <div className="text-3xl font-bold text-slate-800">
                {reports.tpe.reduce((acc: number, curr: any) => acc + curr.actual_amount, 0).toFixed(2)} MAD
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Cash Reports */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">Cash Reports</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {reports.cash.map((r: any) => (
                  <CashReportItem key={r.id} r={r} />
                ))}
                {reports.cash.length === 0 && <li className="p-6 text-slate-400 text-center">No reports</li>}
              </ul>
            </div>

            {/* TPE Reports */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">TPE Reports</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {reports.tpe.map((r: any) => (
                  <li key={r.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-800">{r.users?.name || 'Unknown'}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${r.difference === 0 ? 'bg-slate-100 text-slate-600' : r.difference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        Diff: {r.difference > 0 ? '+' : ''}{r.difference}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 flex justify-between mb-4">
                      <span>System: {r.system_amount} | Tips: {r.tips}</span>
                      <span className="font-medium text-slate-900">Actual: {r.actual_amount}</span>
                    </div>
                    <div className="flex gap-4">
                      {r.system_report_image_url && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Restaurant</span>
                          <a href={r.system_report_image_url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                            <img src={r.system_report_image_url} alt="TPE Restaurant Report" className="w-full h-full object-cover" />
                          </a>
                        </div>
                      )}
                      {r.actual_report_image_url && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Snack</span>
                          <a href={r.actual_report_image_url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                            <img src={r.actual_report_image_url} alt="TPE Snack Report" className="w-full h-full object-cover" />
                          </a>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                {reports.tpe.length === 0 && <li className="p-6 text-slate-400 text-center">No reports</li>}
              </ul>
            </div>

            {/* Gratuite Reports */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">Gratuité</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {reports.gratuite.map((r: any) => (
                  <li key={r.id} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-start gap-4">
                    <div>
                      <div className="font-semibold text-slate-800 mb-1">{r.table_info}</div>
                      <div className="text-sm text-slate-600 italic mb-2">"{r.justification}"</div>
                      <div className="text-xs text-slate-400">By: {r.users?.name}</div>
                    </div>
                    {r.proof_image_url && (
                      <a href={r.proof_image_url} target="_blank" rel="noopener noreferrer" className="shrink-0 block w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                        <img src={r.proof_image_url} alt="Proof" className="w-full h-full object-cover" />
                      </a>
                    )}
                  </li>
                ))}
                {reports.gratuite.length === 0 && <li className="p-6 text-slate-400 text-center">No reports</li>}
              </ul>
            </div>

            {/* DP/PC Reports */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">Demi Pension / Pension Complète</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {reports.dppc.map((r: any) => (
                  <li key={r.id} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">{r.tent_number}</span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{r.board_type}</span>
                      </div>
                      <div className="text-xs text-slate-400">By: {r.users?.name}</div>
                    </div>
                    {r.proof_image_url && (
                      <a href={r.proof_image_url} target="_blank" rel="noopener noreferrer" className="shrink-0 block w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                        <img src={r.proof_image_url} alt="Proof" className="w-full h-full object-cover" />
                      </a>
                    )}
                  </li>
                ))}
                {reports.dppc.length === 0 && <li className="p-6 text-slate-400 text-center">No reports</li>}
              </ul>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
