import React from 'react'

type Props = { units: number }

const StockStatus: React.FC<Props> = ({ units }) => {
  if (units <= 2) {
    return <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">🔴 Critical</span>
  }
  if (units <= 5) {
    return <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold">🟡 Low</span>
  }
  if (units <= 10) {
    return <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold">🟢 Healthy</span>
  }
  return <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">🔵 High</span>
}

export default StockStatus
