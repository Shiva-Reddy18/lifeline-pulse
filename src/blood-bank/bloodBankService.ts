// Demo service for Blood Bank module (no backend) - provides hard-coded data and mutation functions

export type BloodGroup = 'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-'

export type StockItem = {
  id: string
  bloodGroup: BloodGroup
  units: number
  expiry?: string // ISO date string
}

export type HospitalRequest = {
  id: string
  hospital: string
  bloodGroup: BloodGroup
  unitsNeeded: number
  urgency: 'Critical' | 'Normal'
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Fulfilled'
}

export type DeliveryRecord = {
  id: string
  hospital: string
  bloodGroup: BloodGroup
  unitsSent: number
  date: string // ISO
}

let stock: StockItem[] = [
  { id: 's1', bloodGroup: 'A+', units: 8, expiry: addDaysISO(12) },
  { id: 's2', bloodGroup: 'A-', units: 2, expiry: addDaysISO(3) },
  { id: 's3', bloodGroup: 'B+', units: 5, expiry: addDaysISO(7) },
  { id: 's4', bloodGroup: 'O+', units: 12, expiry: addDaysISO(30) },
  { id: 's5', bloodGroup: 'O-', units: 1, expiry: addDaysISO(2) },
  { id: 's6', bloodGroup: 'AB+', units: 4, expiry: addDaysISO(9) },
]

let hospitalRequests: HospitalRequest[] = [
  { id: 'r1', hospital: 'City General Hospital', bloodGroup: 'A-', unitsNeeded: 2, urgency: 'Critical', status: 'Pending' },
  { id: 'r2', hospital: 'Northside Medical Center', bloodGroup: 'O+', unitsNeeded: 4, urgency: 'Normal', status: 'Pending' },
  { id: 'r3', hospital: 'St. Mercy Clinic', bloodGroup: 'AB+', unitsNeeded: 1, urgency: 'Critical', status: 'Pending' },
]

let deliveryLog: DeliveryRecord[] = [
  { id: 'd1', hospital: 'County Hospital', bloodGroup: 'B+', unitsSent: 3, date: addDaysISO(-2) },
]

let approvalStatus: 'Pending' | 'Approved' = 'Pending'

function addDaysISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const latency = (ms=200)=> new Promise((r)=>setTimeout(r,ms))

export async function getStock(): Promise<StockItem[]>{
  await latency()
  return structuredClone(stock)
}

export async function updateStock(bloodGroup: BloodGroup, delta: number, markExpired=false): Promise<StockItem | null>{
  await latency()
  const item = stock.find(s=>s.bloodGroup===bloodGroup)
  if(!item) return null
  item.units = Math.max(0, item.units + delta)
  if(markExpired){
    item.expiry = new Date().toISOString()
    item.units = 0
  }
  return structuredClone(item)
}

export async function getHospitalRequests(): Promise<HospitalRequest[]>{
  await latency()
  return structuredClone(hospitalRequests)
}

export async function acceptRequest(requestId: string): Promise<HospitalRequest | null>{
  await latency()
  const req = hospitalRequests.find(r=>r.id===requestId)
  if(!req) return null
  req.status = 'Accepted'
  return structuredClone(req)
}

export async function rejectRequest(requestId: string): Promise<HospitalRequest | null>{
  await latency()
  const req = hospitalRequests.find(r=>r.id===requestId)
  if(!req) return null
  req.status = 'Rejected'
  return structuredClone(req)
}

export async function fulfillRequest(requestId: string): Promise<{fulfilled: boolean, delivery?: DeliveryRecord, error?: string}>{
  await latency()
  const req = hospitalRequests.find(r=>r.id===requestId)
  if(!req) return {fulfilled:false, error:'Request not found'}
  const stockItem = stock.find(s=>s.bloodGroup===req.bloodGroup)
  if(!stockItem || stockItem.units < req.unitsNeeded) return {fulfilled:false, error:'Insufficient stock'}
  stockItem.units -= req.unitsNeeded
  req.status = 'Fulfilled'
  const rec: DeliveryRecord = { id: 'd'+(deliveryLog.length+1), hospital: req.hospital, bloodGroup: req.bloodGroup, unitsSent: req.unitsNeeded, date: new Date().toISOString() }
  deliveryLog.unshift(rec)
  return {fulfilled:true, delivery: structuredClone(rec)}
}

export async function getDeliveryLog(): Promise<DeliveryRecord[]>{
  await latency()
  return structuredClone(deliveryLog)
}

export async function getApprovalStatus(): Promise<'Pending'|'Approved'>{
  await latency()
  return approvalStatus
}

export async function submitRegistration(payload: {name:string, license:string, address:string, phone:string}): Promise<{status: 'Pending'}>{
  await latency(300)
  approvalStatus = 'Pending'
  // in a real flow you'd persist. Here we just set pending.
  return {status: 'Pending'}
}

export async function fakeApprove(){
  approvalStatus = 'Approved'
  await latency(100)
  return approvalStatus
}

// helper for tests/demo
export function _resetDemo(){
  stock = [
    { id: 's1', bloodGroup: 'A+', units: 8, expiry: addDaysISO(12) },
    { id: 's2', bloodGroup: 'A-', units: 2, expiry: addDaysISO(3) },
    { id: 's3', bloodGroup: 'B+', units: 5, expiry: addDaysISO(7) },
    { id: 's4', bloodGroup: 'O+', units: 12, expiry: addDaysISO(30) },
    { id: 's5', bloodGroup: 'O-', units: 1, expiry: addDaysISO(2) },
    { id: 's6', bloodGroup: 'AB+', units: 4, expiry: addDaysISO(9) },
  ]
  hospitalRequests = [
    { id: 'r1', hospital: 'City General Hospital', bloodGroup: 'A-', unitsNeeded: 2, urgency: 'Critical', status: 'Pending' },
    { id: 'r2', hospital: 'Northside Medical Center', bloodGroup: 'O+', unitsNeeded: 4, urgency: 'Normal', status: 'Pending' },
    { id: 'r3', hospital: 'St. Mercy Clinic', bloodGroup: 'AB+', unitsNeeded: 1, urgency: 'Critical', status: 'Pending' },
  ]
  deliveryLog = [
    { id: 'd1', hospital: 'County Hospital', bloodGroup: 'B+', unitsSent: 3, date: addDaysISO(-2) },
  ]
  approvalStatus = 'Pending'
}
