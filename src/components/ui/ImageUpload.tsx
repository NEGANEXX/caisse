import { useState } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import imageCompression from "browser-image-compression"

interface ImageUploadProps {
  onImageSelected: (file: File | null) => void;
  label?: string;
  description?: string;
}

export function ImageUpload({ 
  onImageSelected, 
  label = "Upload Proof Image", 
  description = "A photo of the system report or justification is required." 
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCompressing(true)

      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }
        const compressedFile = await imageCompression(file, options)
        
        setFileName(file.name)
        setPreview(URL.createObjectURL(compressedFile))
        onImageSelected(compressedFile)
      } catch (err) {
        console.error("Compression error:", err)
        // Fallback to original
        setFileName(file.name)
        setPreview(URL.createObjectURL(file))
        onImageSelected(file)
      } finally {
        setCompressing(false)
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setFileName(null)
    onImageSelected(null)
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 group">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover opacity-90 group-hover:opacity-75 transition-opacity" />
          <div className="absolute top-2 right-2 flex space-x-2">
            <button 
              type="button"
              onClick={handleRemove}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-sm transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 w-full bg-slate-900/70 text-white text-xs px-3 py-2 truncate">
            {fileName}
          </div>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer transition-colors ${compressing ? 'bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {compressing ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
            )}
            <p className="mb-1 text-sm text-slate-600 font-semibold">
              {compressing ? "Compressing..." : "Click to upload"}
            </p>
            <p className="text-xs text-slate-400 text-center px-4">{description}</p>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
            disabled={compressing}
          />
        </label>
      )}
    </div>
  )
}
