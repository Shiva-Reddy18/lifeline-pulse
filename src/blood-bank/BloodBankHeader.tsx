import React from 'react'

type Props = {
  name?: string
  approval: 'Pending'|'Approved'
  onLogout?: ()=>void
}

const BloodBankHeader: React.FC<Props> = ({ name = 'Downtown Blood Bank', approval, onLogout }) => {
  return (
    <header className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-500 text-white p-4 rounded-md shadow-md">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="text-sm opacity-90">Centralized Blood Inventory — Emergency Ready</p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${approval==='Approved' ? 'bg-green-800' : 'bg-yellow-600'}`}>
          {approval === 'Approved' ? 'Approved' : 'Pending Approval'}
        </span>
        <button onClick={onLogout} className="bg-white text-red-600 px-3 py-1 rounded-md font-medium hover:opacity-90 shadow-sm">Logout</button>
      </div>
    </header>
  )
}

export default BloodBankHeader
