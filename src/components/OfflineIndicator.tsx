import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineIndicator() {
  const { isOnline, syncStatus, pendingCount, forceSync } = useOfflineSync();

  const showIndicator = !isOnline || syncStatus === 'syncing' || pendingCount > 0;

  if (!showIndicator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40"
      >
        <div className={`rounded-xl p-4 shadow-lg border ${
          !isOnline 
            ? 'bg-[hsl(var(--status-warning)/0.1)] border-[hsl(var(--status-warning)/0.3)]' 
            : syncStatus === 'error'
            ? 'bg-[hsl(var(--status-critical)/0.1)] border-[hsl(var(--status-critical)/0.3)]'
            : 'bg-muted border-border'
        }`}>
          <div className="flex items-center gap-3">
            {!isOnline ? (
              <WifiOff className="w-5 h-5 text-[hsl(var(--status-warning))]" />
            ) : syncStatus === 'syncing' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-5 h-5 text-primary" />
              </motion.div>
            ) : syncStatus === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-[hsl(var(--status-critical))]" />
            ) : (
              <Check className="w-5 h-5 text-[hsl(var(--status-stable))]" />
            )}

            <div className="flex-1">
              <p className="font-medium text-sm">
                {!isOnline 
                  ? 'You are offline'
                  : syncStatus === 'syncing'
                  ? 'Syncing...'
                  : syncStatus === 'error'
                  ? 'Sync failed'
                  : 'Sync complete'}
              </p>
              {pendingCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {pendingCount} emergency request{pendingCount > 1 ? 's' : ''} queued
                </p>
              )}
              {!isOnline && (
                <p className="text-xs text-muted-foreground">
                  Emergency requests will sync when back online
                </p>
              )}
            </div>

            {isOnline && pendingCount > 0 && syncStatus !== 'syncing' && (
              <Button
                variant="outline"
                size="sm"
                onClick={forceSync}
                className="gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Sync
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
