import React, { useState } from 'react'
import { submitRegistration } from './bloodBankService'

const BloodBankRegistration: React.FC = ()=>{
  const [name, setName] = useState('')
  const [license, setLicense] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent)=>{
    e.preventDefault()
    setLoading(true)
    await submitRegistration({name, license, address, phone})
    setStatus('Pending hospital approval')
    setLoading(false)
  }

  if(status) return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h3 className="font-semibold">Registration submitted</h3>
      <p className="text-sm text-gray-700 mt-2">Status: <strong>{status}</strong></p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow-sm space-y-3">
      <h3 className="font-semibold">Register Blood Bank</h3>
      <input value={name} onChange={e=>setName(e.target.value)} required placeholder="Blood bank name" className="w-full border rounded-md px-3 py-2" />
      <input value={license} onChange={e=>setLicense(e.target.value)} required placeholder="License number" className="w-full border rounded-md px-3 py-2" />
      <input value={address} onChange={e=>setAddress(e.target.value)} required placeholder="Address" className="w-full border rounded-md px-3 py-2" />
      <input value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="Phone" className="w-full border rounded-md px-3 py-2" />
      <div className="flex justify-end">
        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md">{loading? 'Submitting...' : 'Submit'}</button>
      </div>
    </form>
  )
}

export default BloodBankRegistration
