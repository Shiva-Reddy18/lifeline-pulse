import React, { useEffect, useState } from 'react'
import { getApprovalStatus, fakeApprove } from './bloodBankService'

const BloodBankApprovalStatus: React.FC = ()=>{
  const [status, setStatus] = useState<'Pending'|'Approved'|'Loading'>('Loading')

  useEffect(()=>{
    const f = async ()=>{
      const s = await getApprovalStatus()
      setStatus(s)
    }
    f()
  },[])

  if(status === 'Loading') return <div className="bg-white p-4 rounded-md shadow-sm">Checking approval...</div>

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      {status === 'Pending' ? (
        <>
          <h3 className="font-semibold">Waiting for hospital approval</h3>
          <p className="text-sm text-gray-600 mt-2">Your registration is being reviewed. Once approved you can operate and fulfill requests.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={async ()=>{ await fakeApprove(); setStatus('Approved') }} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">Simulate Approve</button>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-green-700">Approved — you can now operate</h3>
          <p className="text-sm text-gray-600 mt-2">Your blood bank is live and can accept and fulfill requests.</p>
        </>
      )}
    </div>
  )
}

export default BloodBankApprovalStatus
