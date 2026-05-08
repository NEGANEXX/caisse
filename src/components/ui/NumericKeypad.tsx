"use client"

import { useState } from "react"
import { Grip, Delete } from "lucide-react"

interface NumericKeypadProps {
  onSubmit: (pin: string) => void
  loading?: boolean
  error?: string
}

export function NumericKeypad({ onSubmit, loading, error }: NumericKeypadProps) {
  const [pin, setPin] = useState("")

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
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

  const keypadNumbers = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3]
  ];

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl">
      <div className="pt-10 pb-6 px-6 bg-white flex flex-col items-center">
        {/* Top Icons */}
        <div className="flex justify-center mb-10">
          <div className="w-14 h-14 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-500">
            <Grip className="w-6 h-6" />
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex space-x-4 mb-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                i < pin.length ? "border-slate-500" : "border-slate-300"
              }`}
            >
              {i < pin.length && (
                <div className="w-2.5 h-2.5 bg-slate-500 rounded-full" />
              )}
            </div>
          ))}
        </div>
        {error ? (
          <p className="text-red-500 text-sm font-medium mt-4 h-5">{error}</p>
        ) : (
          <div className="h-5 mt-4" /> // Spacer
        )}
      </div>

      {/* Keypad */}
      <div className="bg-white">
        {keypadNumbers.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 border-t border-slate-100">
            {row.map((num, colIndex) => (
              <button
                key={num}
                onClick={() => handleNumber(num.toString())}
                disabled={loading}
                className={`h-20 text-2xl font-light text-slate-800 hover:bg-slate-50 transition-colors active:bg-slate-100 flex items-center justify-center
                  ${colIndex !== 2 ? 'border-r border-slate-100' : ''}
                `}
              >
                {num}
              </button>
            ))}
          </div>
        ))}
        
        {/* Bottom Row */}
        <div className="grid grid-cols-3 border-t border-slate-100">
          <button
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            className="h-20 text-2xl font-light text-slate-800 hover:bg-slate-50 transition-colors active:bg-slate-100 flex items-center justify-center border-r border-slate-100"
          >
            C
          </button>
          <button
            onClick={() => handleNumber("0")}
            disabled={loading}
            className="h-20 text-2xl font-light text-slate-800 hover:bg-slate-50 transition-colors active:bg-slate-100 flex items-center justify-center border-r border-slate-100"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-20 text-slate-600 hover:bg-slate-50 transition-colors active:bg-slate-100 flex items-center justify-center"
          >
            <Delete className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>
      </div>
      
      {/* Submit button */}
      <div className="p-6 bg-white border-t border-slate-100">
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length === 0}
          className="w-full h-14 rounded-2xl bg-teal-500 text-white text-lg font-medium shadow-md hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Authenticating..." : "Login"}
        </button>
      </div>
    </div>
  )
}
