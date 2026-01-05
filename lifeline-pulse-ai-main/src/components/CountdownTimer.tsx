import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { UrgencyLevel } from '@/types/emergency';
import { useCountdown } from '@/hooks/useCountdown';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: Date;
  urgency: UrgencyLevel;
  label?: string;
}

export function CountdownTimer({ expiresAt, urgency, label = "Time remaining" }: CountdownTimerProps) {
  const { hours, minutes, seconds, isExpired } = useCountdown(expiresAt);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  const getStatusIcon = () => {
    if (isExpired) return <AlertCircle className="w-5 h-5" />;
    if (urgency === 'critical') return <AlertCircle className="w-5 h-5" />;
    if (urgency === 'stable') return <CheckCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  const getBadgeVariant = () => {
    if (isExpired) return 'critical';
    return urgency;
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {getStatusIcon()}
        <span className="text-sm font-medium">{label}</span>
      </div>

      <div className="flex items-center gap-1">
        {isExpired ? (
          <Badge variant="critical" className="text-lg px-4 py-2">
            EXPIRED
          </Badge>
        ) : (
          <div className={`flex items-center gap-1 font-mono text-3xl font-bold ${
            urgency === 'critical' ? 'countdown-critical' : ''
          }`}>
            <TimeBlock value={formatTime(hours)} label="HRS" urgency={urgency} />
            <span className="text-muted-foreground">:</span>
            <TimeBlock value={formatTime(minutes)} label="MIN" urgency={urgency} />
            <span className="text-muted-foreground">:</span>
            <TimeBlock value={formatTime(seconds)} label="SEC" urgency={urgency} />
          </div>
        )}
      </div>

      <Badge variant={getBadgeVariant()} className="mt-1">
        {urgency === 'critical' && 'CRITICAL'}
        {urgency === 'warning' && 'URGENT'}
        {urgency === 'stable' && 'STABLE'}
        {isExpired && 'EXPIRED'}
      </Badge>
    </motion.div>
  );
}

function TimeBlock({ value, label, urgency }: { value: string; label: string; urgency: UrgencyLevel }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className={`px-3 py-2 rounded-lg ${
          urgency === 'critical' 
            ? 'bg-primary/10 text-primary' 
            : urgency === 'warning'
            ? 'bg-status-warning/10 text-status-warning'
            : 'bg-muted text-foreground'
        }`}
        key={value}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {value}
      </motion.div>
      <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
