"use client"

import { useState } from "react"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { supabase } from "@/lib/supabase/client"
import { Save } from "lucide-react"

export default function TpeRapportPage() {
  const [systemAmount, setSystemAmount] = useState("")
  const [actualAmount, setActualAmount] = useState("")
  const [tips, setTips] = useState("")
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [actualProofImage, setActualProofImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])

  const parsedSystem = parseFloat(systemAmount) || 0
  const parsedActual = parseFloat(actualAmount) || 0
  const parsedTips = parseFloat(tips) || 0

  // Usually Tips are part of the actual amount swiped, 
  // so the true "revenue" found is Actual - Tips.
  // Difference = (Actual - Tips) - System
  const difference = (parsedActual - parsedTips) - parsedSystem

  const handleSave = async () => {
    if (!systemAmount || !actualAmount) {
      setMessage("Please enter both system and actual amounts.")
      return
    }
    if (!proofImage) {
      setMessage("Please upload a picture of the Restaurant system report.")
      return
    }
    if (!actualProofImage) {
      setMessage("Please upload a picture of the Snack system report.")
      return
    }

    setLoading(true)
    setMessage("")
    
    try {
      const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
      
      // Upload system proof image
      const fileExt = proofImage.name.split('.').pop()
      const fileName = `${reportDate}_tpe_system_${Math.random()}.${fileExt}`
      const filePath = `${staffId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, proofImage)

      if (uploadError) throw uploadError

      const { data: { publicUrl: systemUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      // Upload actual TPE ticket image
      const actualFileExt = actualProofImage.name.split('.').pop()
      const actualFileName = `${reportDate}_tpe_actual_${Math.random()}.${actualFileExt}`
      const actualFilePath = `${staffId}/${actualFileName}`

      const { error: actualUploadError } = await supabase.storage
        .from('receipts')
        .upload(actualFilePath, actualProofImage)

      if (actualUploadError) throw actualUploadError

      const { data: { publicUrl: actualUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(actualFilePath)

      const { error } = await supabase.from('tpe_reports').insert({
        report_date: reportDate,
        staff_id: staffId,
        system_amount: parsedSystem,
        actual_amount: parsedActual,
        tips: parsedTips,
        difference: difference,
        system_report_image_url: systemUrl,
        actual_report_image_url: actualUrl
      })

      if (error) throw error
      setMessage("TPE report saved successfully!")
      setSystemAmount("")
      setActualAmount("")
      setTips("")
      setProofImage(null)
      setActualProofImage(null)
    } catch (error: any) {
      console.error(error)
      setMessage("Error saving report: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">TPE Rapport</h1>
          <p className="text-slate-500 mt-1">Verify credit card machine totals.</p>
        </div>
        <div className="flex items-center space-x-4">
          <input 
            type="date" 
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium outline-none focus:ring-2 focus:ring-primary"
          />
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? "Saving..." : "Save Report"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg font-medium ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">System Amount (MAD)</label>
            <input 
              type="number" 
              value={systemAmount}
              onChange={(e) => setSystemAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-semibold text-slate-800 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <p className="text-xs text-slate-400 mt-2">The total according to eZee Optimus.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Actual TPE Total (MAD)</label>
            <input 
              type="number" 
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-semibold text-slate-800 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <p className="text-xs text-slate-400 mt-2">The closing total printed by the machine.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Tips / Pourboire included (MAD)</label>
          <input 
            type="number" 
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            placeholder="0.00"
            className="w-full md:w-1/2 text-2xl font-semibold text-slate-800 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <ImageUpload 
            onImageSelected={setProofImage} 
            label="Restaurant System Proof" 
            description="Take a photo of the TPE terminal closing receipt for the Restaurant."
          />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <ImageUpload 
            onImageSelected={setActualProofImage} 
            label="Snack System Proof" 
            description="Take a photo of the TPE terminal closing receipt for the Snack."
          />
        </div>
      </div>

      {/* Difference Banner */}
      <div className={`p-6 rounded-xl shadow-sm border ${difference === 0 ? 'bg-slate-50 border-slate-200' : difference > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className={`text-sm font-bold mb-1 ${difference === 0 ? 'text-slate-600' : difference > 0 ? 'text-green-700' : 'text-red-700'}`}>
          Calculated Difference (Actual - Tips - System)
        </p>
        <div className={`text-4xl font-bold ${difference === 0 ? 'text-slate-800' : difference > 0 ? 'text-green-700' : 'text-red-700'}`}>
          {difference > 0 ? '+' : ''}{difference.toFixed(2)} MAD
        </div>
      </div>
    </div>
  )
}
