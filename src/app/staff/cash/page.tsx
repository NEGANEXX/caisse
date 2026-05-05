"use client"

import { useState } from "react"
import { CurrencyGrid } from "@/components/ui/CurrencyGrid"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { supabase } from "@/lib/supabase/client"
import { Save } from "lucide-react"

const MAD_DENOMINATIONS = [200, 100, 50, 20, 10, 5, 2, 1, 0.5]
const USD_DENOMINATIONS = [100, 50, 20, 10, 5, 1]
const EUR_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1]

// Exchange rates for calculation (placeholder - should be dynamic in prod)
const RATES = {
  USD_TO_MAD: 10,
  EUR_TO_MAD: 11
}

export default function CashRapportPage() {
  const [systemAmount, setSystemAmount] = useState<string>("")
  const [totals, setTotals] = useState({ MAD: 0, USD: 0, EUR: 0 })
  const [breakdowns, setBreakdowns] = useState({ MAD: {}, USD: {}, EUR: {} })
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [actualProofImage, setActualProofImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const actualAmountMAD = totals.MAD + (totals.USD * RATES.USD_TO_MAD) + (totals.EUR * RATES.EUR_TO_MAD)
  const difference = actualAmountMAD - (parseFloat(systemAmount) || 0)

  const handleCurrencyChange = (currency: "MAD" | "USD" | "EUR") => (total: number, breakdown: Record<string, number>) => {
    setTotals(prev => ({ ...prev, [currency]: total }))
    setBreakdowns(prev => ({ ...prev, [currency]: breakdown }))
  }

  const handleSave = async () => {
    if (!systemAmount) {
      setMessage("Please enter the system amount.")
      return
    }
    if (!proofImage) {
      setMessage("Please upload a picture of the system report.")
      return
    }
    if (!actualProofImage) {
      setMessage("Please upload a picture of the actual physical cash.")
      return
    }

    setLoading(true)
    setMessage("")
    
    try {
      // In a real app, you get this from your auth state/cookie
      const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
      const reportDate = new Date().toISOString().split('T')[0]
      
      // Upload system proof image
      const fileExt = proofImage.name.split('.').pop()
      const fileName = `${reportDate}_cash_system_${Math.random()}.${fileExt}`
      const filePath = `${staffId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, proofImage)

      if (uploadError) throw uploadError

      const { data: { publicUrl: systemUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      // Upload actual cash proof image
      const actualFileExt = actualProofImage.name.split('.').pop()
      const actualFileName = `${reportDate}_cash_actual_${Math.random()}.${actualFileExt}`
      const actualFilePath = `${staffId}/${actualFileName}`

      const { error: actualUploadError } = await supabase.storage
        .from('receipts')
        .upload(actualFilePath, actualProofImage)

      if (actualUploadError) throw actualUploadError

      const { data: { publicUrl: actualUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(actualFilePath)

      const { error } = await supabase.from('cash_reports').insert({
        report_date: reportDate,
        staff_id: staffId, // Might be undefined if not properly auth'd, schema needs to handle it or enforce
        system_amount: parseFloat(systemAmount),
        actual_amount: actualAmountMAD,
        difference: difference,
        breakdown_mad: breakdowns.MAD,
        breakdown_usd: breakdowns.USD,
        breakdown_eur: breakdowns.EUR,
        system_report_image_url: systemUrl,
        actual_report_image_url: actualUrl
      })

      if (error) throw error
      setMessage("Cash report saved successfully!")
      setSystemAmount("")
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
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cash Rapport</h1>
          <p className="text-slate-500 mt-1">Calculate and verify the daily cash register.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? "Saving..." : "Save Report"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg font-medium ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">System Amount (MAD)</p>
          <input 
            type="number" 
            value={systemAmount}
            onChange={(e) => setSystemAmount(e.target.value)}
            placeholder="0.00"
            className="w-full text-3xl font-bold text-slate-800 outline-none border-b border-dashed border-slate-300 pb-1 focus:border-primary"
          />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Actual Amount (MAD)</p>
          <div className="text-3xl font-bold text-slate-800">
            {actualAmountMAD.toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Includes converted USD & EUR</p>
        </div>
        <div className={`p-6 rounded-xl shadow-sm border ${difference === 0 ? 'bg-slate-50 border-slate-200' : difference > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm font-medium mb-1 ${difference === 0 ? 'text-slate-500' : difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
            Difference
          </p>
          <div className={`text-3xl font-bold ${difference === 0 ? 'text-slate-800' : difference > 0 ? 'text-green-700' : 'text-red-700'}`}>
            {difference > 0 ? '+' : ''}{difference.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <ImageUpload 
            onImageSelected={setProofImage} 
            label="System Report Proof" 
            description="Take a photo of the cash system report from the POS."
          />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <ImageUpload 
            onImageSelected={setActualProofImage} 
            label="Physical Cash Proof" 
            description="Take a photo of the physical cash counted."
          />
        </div>
      </div>

      <div className="space-y-6">
        <CurrencyGrid 
          title="Dirham Marocain" 
          symbol="MAD" 
          denominations={MAD_DENOMINATIONS} 
          onChange={handleCurrencyChange("MAD")} 
        />
        <CurrencyGrid 
          title="US Dollar" 
          symbol="USD" 
          denominations={USD_DENOMINATIONS} 
          onChange={handleCurrencyChange("USD")} 
        />
        <CurrencyGrid 
          title="Euro" 
          symbol="EUR" 
          denominations={EUR_DENOMINATIONS} 
          onChange={handleCurrencyChange("EUR")} 
        />
      </div>
    </div>
  )
}
