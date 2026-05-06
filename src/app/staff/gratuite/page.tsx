"use client"

import { useState } from "react"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { supabase } from "@/lib/supabase/client"
import { Save } from "lucide-react"

export default function GratuitePage() {
  const [tableInfo, setTableInfo] = useState("")
  const [justification, setJustification] = useState("")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  
  const [tentNumber, setTentNumber] = useState("")
  const [boardType, setBoardType] = useState("Demi Pension")
  
  const [proofImageG, setProofImageG] = useState<File | null>(null)
  const [loadingG, setLoadingG] = useState(false)
  const [messageG, setMessageG] = useState("")

  const [proofImageD, setProofImageD] = useState<File | null>(null)
  const [loadingD, setLoadingD] = useState(false)
  const [messageD, setMessageD] = useState("")

  const handleSaveGratuite = async () => {
    if (!tableInfo || !justification) {
      setMessageG("Please fill all fields.")
      return
    }
    if (!proofImageG) {
      setMessageG("Please upload a proof image.")
      return
    }

    setLoadingG(true)
    setMessageG("")
    try {
      const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
      
      const fileExt = proofImageG.name.split('.').pop()
      const fileName = `${reportDate}_gratuite_${Math.random()}.${fileExt}`
      const filePath = `${staffId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, proofImageG)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath)

      const { error } = await supabase.from('gratuite_reports').insert({
        report_date: reportDate,
        staff_id: staffId,
        table_info: tableInfo,
        justification: justification,
        proof_image_url: publicUrl
      })
      if (error) throw error
      setMessageG("Saved successfully!")
      setTableInfo("")
      setJustification("")
      setProofImageG(null)
    } catch (error: any) {
      setMessageG("Error: " + error.message)
    } finally {
      setLoadingG(false)
    }
  }

  const handleSaveBoard = async () => {
    if (!tentNumber) {
      setMessageD("Please enter a tent number.")
      return
    }
    if (!proofImageD) {
      setMessageD("Please upload a proof image.")
      return
    }

    setLoadingD(true)
    setMessageD("")
    try {
      const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
      
      const fileExt = proofImageD.name.split('.').pop()
      const fileName = `${reportDate}_dppc_${Math.random()}.${fileExt}`
      const filePath = `${staffId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, proofImageD)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath)

      const { error } = await supabase.from('dp_pc_reports').insert({
        report_date: reportDate,
        staff_id: staffId,
        tent_number: tentNumber,
        board_type: boardType,
        proof_image_url: publicUrl
      })
      if (error) throw error
      setMessageD("Saved successfully!")
      setTentNumber("")
      setProofImageD(null)
    } catch (error: any) {
      setMessageD("Error: " + error.message)
    } finally {
      setLoadingD(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gratuité, DP & PC</h1>
          <p className="text-slate-500 mt-1">Log free tables and track half/full board tents.</p>
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

      {/* Gratuite Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800">Gratuité (Free Tables)</h2>
          <button 
            onClick={handleSaveGratuite}
            disabled={loadingG}
            className="flex items-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loadingG ? "Saving..." : "Save"}
          </button>
        </div>
        
        {messageG && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${messageG.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {messageG}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Table Info / N°</label>
            <input 
              type="text" 
              value={tableInfo}
              onChange={(e) => setTableInfo(e.target.value)}
              placeholder="e.g. Table 12, Poolside 4"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Justification</label>
            <input 
              type="text" 
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Reason for freebie"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <ImageUpload 
            onImageSelected={setProofImageG} 
            label="Proof Image" 
            description="Upload a photo as justification for the free items."
          />
        </div>
      </section>

      {/* DP / PC Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800">Demi Pension (DP) / Pension Complète (PC)</h2>
          <button 
            onClick={handleSaveBoard}
            disabled={loadingD}
            className="flex items-center px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg shadow hover:bg-slate-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loadingD ? "Saving..." : "Save"}
          </button>
        </div>

        {messageD && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${messageD.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {messageD}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
            <select
              value={boardType}
              onChange={(e) => setBoardType(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="Demi Pension">Demi Pension (DP)</option>
              <option value="Pension Complete">Pension Complète (PC)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Numéro de Tente</label>
            <input 
              type="text" 
              value={tentNumber}
              onChange={(e) => setTentNumber(e.target.value)}
              placeholder="e.g. Tente 5"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <ImageUpload 
            onImageSelected={setProofImageD} 
            label="Proof Image" 
            description="Upload a photo as proof for this specific tent."
          />
        </div>
      </section>
    </div>
  )
}
