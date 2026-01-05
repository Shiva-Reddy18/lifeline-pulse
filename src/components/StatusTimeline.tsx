import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmergencyStatus } from '@/types/emergency';
import { 
  Circle, 
  Hospital, 
  CheckCircle, 
  Truck, 
  Package, 
  XCircle,
  Loader2
} from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: EmergencyStatus;
  compact?: boolean;
}

const statusSteps: { status: EmergencyStatus; label: string; icon: React.ComponentType<any> }[] = [
  { status: 'created', label: 'Request Created', icon: Circle },
  { status: 'hospital_verified', label: 'Hospital Verified', icon: Hospital },
  { status: 'accepted', label: 'Accepted', icon: CheckCircle },
  { status: 'in_transit', label: 'In Transit', icon: Truck },
  { status: 'fulfilled', label: 'Fulfilled', icon: Package },
];

const statusOrder: EmergencyStatus[] = [
  'created',
  'hospital_verified',
  'accepted',
  'in_transit',
  'fulfilled',
  'auto_closed',
];

export function StatusTimeline({ currentStatus, compact = false }: StatusTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isTerminal = currentStatus === 'fulfilled' || currentStatus === 'auto_closed' || currentStatus === 'expired';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {statusSteps.slice(0, 5).map((step, index) => {
          const isCompleted = currentIndex > index || currentStatus === 'fulfilled';
          const isCurrent = statusOrder[index] === currentStatus;

          return (
            <div key={step.status} className="flex items-center">
              <motion.div
                className={`w-3 h-3 rounded-full ${
                  isCompleted 
                    ? 'bg-status-stable' 
                    : isCurrent 
                    ? 'bg-primary' 
                    : 'bg-muted'
                }`}
                initial={false}
                animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              {index < 4 && (
                <div className={`w-6 h-0.5 ${isCompleted ? 'bg-status-stable' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardContent className="p-6">
        <div className="relative">
          {statusSteps.map((step, index) => {
            const isCompleted = currentIndex > index || currentStatus === 'fulfilled';
            const isCurrent = statusOrder[index] === currentStatus;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.status}
                className="flex items-start gap-4 relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Connector line */}
                {index < statusSteps.length - 1 && (
                  <div 
                    className={`absolute left-5 top-10 w-0.5 h-12 ${
                      isCompleted ? 'bg-status-stable' : 'bg-border'
                    }`}
                  />
                )}

                {/* Status icon */}
                <motion.div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-status-stable text-white' 
                      : isCurrent 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {isCurrent && !isTerminal ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </motion.div>

                {/* Status content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${
                      isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <Badge variant="urgent" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="verified" className="text-xs">
                        Complete
                      </Badge>
                    )}
                  </div>
                  {isCurrent && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Processing your request...
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Terminal states */}
          {(currentStatus === 'expired' || currentStatus === 'auto_closed') && (
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">
                  {currentStatus === 'expired' ? 'Request Expired' : 'Auto Closed'}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
