"use client"

import { useState } from "react"
import { Delete } from "lucide-react"

interface NumericKeypadProps {
  onSubmit: (pin: string) => void
  loading?: boolean
  error?: string
}

export function NumericKeypad({ onSubmit, loading, error }: NumericKeypadProps) {
  const [pin, setPin] = useState("")

  const handleNumber = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num)
    }
  }

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPin("")
  }

  const handleSubmit = () => {
    if (pin.length > 0) {
      onSubmit(pin)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-lg border border-slate-200">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Enter PIN</h2>
        <div className="flex justify-center space-x-3 mb-2 h-10 items-center">
          {[0, 1, 2, 3].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < pin.length ? "bg-primary" : "bg-slate-200"
              }`}
            />
          ))}
          {pin.length > 4 && (
            <div className="text-primary font-bold ml-2">...</div>
          )}
        </div>
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumber(num.toString())}
            disabled={loading}
            className="h-14 sm:h-16 rounded-lg bg-slate-50 text-2xl font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={loading || pin.length === 0}
          className="h-14 sm:h-16 rounded-lg bg-slate-100 text-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          Clear
        </button>
        <button
          onClick={() => handleNumber("0")}
          disabled={loading}
          className="h-14 sm:h-16 rounded-lg bg-slate-50 text-2xl font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || pin.length === 0}
          className="h-14 sm:h-16 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || pin.length === 0}
        className="w-full h-14 rounded-lg bg-primary text-white text-lg font-bold shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Authenticating..." : "Login"}
      </button>
    </div>
  )
}
