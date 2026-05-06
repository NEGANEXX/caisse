"use client"

import { useState, useEffect } from "react"

interface Denomination {
  value: number
  count: number
  image?: string // Path to placeholder/image
}

interface CurrencyGridProps {
  title: string
  symbol: string
  denominations: number[]
  rate?: number
  onChange: (total: number, breakdown: Record<string, number>) => void
}

export function CurrencyGrid({ title, symbol, denominations, rate, onChange }: CurrencyGridProps) {
  const [counts, setCounts] = useState<Record<string, number>>(
    denominations.reduce((acc, curr) => ({ ...acc, [curr.toString()]: 0 }), {})
  )

  const handleCountChange = (val: string, countStr: string) => {
    const newCount = countStr === "" ? 0 : parseInt(countStr, 10)
    if (isNaN(newCount) || newCount < 0) return

    const newCounts = { ...counts, [val]: newCount }
    setCounts(newCounts)

    const total = Object.entries(newCounts).reduce((acc, [v, count]) => {
      return acc + (parseFloat(v) * count)
    }, 0)
    onChange(total, newCounts)
  }

  const getCurrencyStyle = (symbol: string, val: number) => {
    let imageUrl = ""
    let isCoin = false
    let classes = ""

    if (symbol === 'MAD') {
      isCoin = val <= 10
      imageUrl = `/currency/mad_${val}.jpg`
    } else if (symbol === 'USD') {
      isCoin = false // USD doesn't have coins in this array
      if (val === 5) imageUrl = `/currency/usd_5.png`
      else imageUrl = `/currency/usd_${val}.jpg`
    } else if (symbol === 'EUR') {
      isCoin = val <= 2
      if (val === 50 || val === 20 || val === 10 || val === 0.1) {
        imageUrl = `/currency/eur_${val}.webp`
      } else if (val === 0.5 || val === 0.2) {
        imageUrl = `/currency/eur_${val}.png`
      } else {
        imageUrl = `/currency/eur_${val}.jpg`
      }
    }

    if (isCoin) {
      classes = 'w-16 h-16 rounded-full mx-auto shadow-sm overflow-hidden bg-white flex items-center justify-center border border-slate-100'
    } else {
      // Increased height slightly for better banknote visibility
      classes = 'h-24 w-full rounded-md overflow-hidden bg-white flex items-center justify-center'
    }

    return { isCoin, classes, imageUrl }
  }

  return (
    <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4">{title} ({symbol})</h3>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {denominations.map((val) => {
          const style = getCurrencyStyle(symbol, val)
          return (
          <div key={val} className="flex flex-col space-y-2 sm:space-y-3 bg-slate-50 p-2 sm:p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className={style.isCoin ? "h-24 flex items-center justify-center" : ""}>
              <div className={style.classes}>
                {style.imageUrl ? (
                  <img src={style.imageUrl} alt={`${val} ${symbol}`} className="w-full h-full object-contain p-1 drop-shadow-sm" />
                ) : (
                  <>
                    {!style.isCoin && <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>}
                    <span className="relative z-10 drop-shadow-sm">{val} <span className="text-sm opacity-80">{symbol}</span></span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-slate-600">x</span>
              <input
                type="number"
                min="0"
                value={counts[val.toString()] || ""}
                onChange={(e) => handleCountChange(val.toString(), e.target.value)}
                className="w-16 h-8 text-center border border-slate-300 rounded text-slate-800 font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="0"
              />
            </div>
            <div className="text-right text-xs font-bold text-slate-500">
              = {(val * (counts[val.toString()] || 0) * (rate || 1)).toFixed(2)} {rate ? 'MAD' : symbol}
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
