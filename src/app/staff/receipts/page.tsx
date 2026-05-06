"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Upload, X, Save } from "lucide-react"
import imageCompression from "browser-image-compression"

export default function ZipReceiptsPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select at least one file to upload.")
      return
    }

    setUploading(true)
    setMessage("")

    try {
      const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]

      for (const file of files) {
        let fileToUpload = file

        // Compress image before upload
        try {
          const options = {
            maxSizeMB: 0.5, // 500 KB max
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          }
          fileToUpload = await imageCompression(file, options)
        } catch (err) {
          console.error("Compression error:", err)
          // if compression fails, we just upload the original file
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${reportDate}_${Math.random()}.${fileExt}`
        const filePath = `${staffId}/${fileName}`

        // 1. Upload image to Storage bucket 'receipts'
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, fileToUpload)

        if (uploadError) throw uploadError

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath)

        // 3. Save reference in database
        const { error: dbError } = await supabase.from('receipt_images').insert({
          report_date: reportDate,
          staff_id: staffId,
          file_url: publicUrl,
          file_path: filePath
        })

        if (dbError) throw dbError
      }

      setMessage("All receipts uploaded successfully!")
      setFiles([])
    } catch (error: any) {
      console.error(error)
      setMessage("Error uploading receipts: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Receipts</h1>
          <p className="text-slate-500 mt-1">Upload pictures of tickets and slips for the Manager to ZIP.</p>
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

      {message && (
        <div className={`p-4 rounded-lg font-medium ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 text-slate-400 mb-3" />
            <p className="mb-2 text-sm text-slate-500 font-semibold">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400">PNG, JPG, JPEG (MAX. 5MB per file)</p>
          </div>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-800">Selected Files ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex justify-center items-center px-4 py-3 bg-primary text-white font-bold rounded-lg shadow hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {uploading ? "Uploading..." : "Upload All Receipts"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
