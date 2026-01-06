import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Download, FileText, BarChart3, Calendar } from 'lucide-react';

interface HistoryRecord {
  id: string;
  patientId: string;
  condition: string;
  bloodGroup: string;
  unitsUsed: number;
  date: Date;
  outcome: 'successful' | 'ongoing' | 'unsuccessful';
  responseTime: string;
}

export default function HistoryRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [records] = useState<HistoryRecord[]>([/* sample records omitted for brevity */]);

  const filteredRecords = records.filter(r => r.patientId.toLowerCase().includes(searchTerm.toLowerCase()) || r.condition.toLowerCase().includes(searchTerm.toLowerCase()) || r.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()));

  const stats = { totalCases: records.length, totalUnits: records.reduce((sum, r) => sum + r.unitsUsed, 0), avgResponseTime: '1 hour 12 mins', successRate: '100%' };

  const handleExportPDF = () => { alert('Exporting records to PDF...'); };
  const handleExportCSV = () => { alert('Exporting records to CSV...'); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">History & Records</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}><Download className="w-4 h-4" />PDF Export</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}><Download className="w-4 h-4" />CSV Export</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[{ label: 'Total Cases', value: stats.totalCases, icon: FileText }, { label: 'Total Units Used', value: stats.totalUnits, icon: 'blood' }, { label: 'Avg Response Time', value: stats.avgResponseTime, icon: Calendar }, { label: 'Success Rate', value: stats.successRate, icon: BarChart3 }].map((stat, idx) => (
          <Card key={idx}><CardContent className="pt-6"><div className="space-y-1"><p className="text-xs text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="Search by patient ID, condition, or blood group..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Past Emergencies</h3>
        {filteredRecords.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">No records found</CardContent></Card>
        ) : (
          filteredRecords.map((record, idx) => (
            <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="hover:shadow-md transition-shadow"><CardContent className="pt-6"><div className="flex items-start justify-between gap-4"><div className="flex-1"><div className="flex items-start gap-3"><div><h4 className="font-semibold">{record.condition}</h4><p className="text-sm text-muted-foreground mt-1">Patient: {record.patientId}</p><div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground"><span>🩸 {record.bloodGroup}</span><span>{record.unitsUsed} units used</span><span>⏱️ {record.responseTime}</span><span>{record.date.toLocaleDateString()}</span></div></div></div></div><div className="flex items-center gap-2"><Badge variant={record.outcome === 'successful' ? 'default' : 'destructive'}>{record.outcome.toUpperCase()}</Badge></div></CardContent></Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
