"use client"

import { useState } from "react"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { supabase } from "@/lib/supabase/client"
import { Save } from "lucide-react"

export default function TipsPage() {
  const [amount, setAmount] = useState("")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSave = async () => {
    if (!amount) {
      setMessage("Please enter the tips amount.")
      return
    }
    if (!proofImage) {
      setMessage("Please upload a proof image.")
      return
    }

    setLoading(true)
    setMessage("")
    try {
      const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
      
      const fileExt = proofImage.name.split('.').pop()
      const fileName = `${reportDate}_tips_${Math.random()}.${fileExt}`
      const filePath = `${staffId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, proofImage)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath)

      const { error } = await supabase.from('tips_reports').insert({
        report_date: reportDate,
        staff_id: staffId,
        amount: parseFloat(amount),
        proof_image_url: publicUrl
      })
      if (error) throw error
      
      setMessage("Tips saved successfully!")
      setAmount("")
      setProofImage(null)
    } catch (error: any) {
      setMessage("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tips Rapport</h1>
          <p className="text-slate-500 mt-1">Declare your tips and upload proof.</p>
        </div>
        <div className="flex items-center space-x-4">
          <input 
            type="date" 
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800">Tips Information</h2>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
        
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Total Amount (MAD)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full md:w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none text-xl font-bold"
          />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <ImageUpload 
            onImageSelected={setProofImage} 
            label="Proof Image" 
            description="Upload a photo as proof for the declared tips."
          />
        </div>
      </section>
    </div>
  )
}
