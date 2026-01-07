import { useEffect, useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getQueuedDeliveries, deleteQueuedDelivery } from '@/lib/offlineStorage';
import type { DeliveryQueueItem } from '@/lib/offlineStorage';

export default function QueuedDeliveries({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [queued, setQueued] = useState<DeliveryQueueItem[]>([]);
  const { toast } = useToast();

  const refresh = async () => {
    const q = await getQueuedDeliveries();
    setQueued(q);
  };

  useEffect(() => {
    refresh();

    const onChange = () => refresh();
    window.addEventListener('offline-queue-changed', onChange);
    window.addEventListener('deliveries-changed', onChange);

    return () => {
      window.removeEventListener('offline-queue-changed', onChange);
      window.removeEventListener('deliveries-changed', onChange);
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteQueuedDelivery(id);
      toast({ title: 'Removed', description: 'Queued delivery canceled.' });
      refresh();
      window.dispatchEvent(new Event('offline-queue-changed'));
    } catch (e) {
      console.error('Failed to remove queued delivery', e);
      toast({ title: 'Error', description: 'Could not remove queued delivery.' });
    }
  };

  const handleRetry = async () => {
    // Trigger the global online handler which runs syncQueuedDeliveries
    window.dispatchEvent(new Event('online'));
    toast({ title: 'Retrying', description: 'Attempting to sync queued items now.' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) refresh(); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Queued Deliveries</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {queued.length === 0 ? (
            <div className="text-sm text-muted-foreground">No queued deliveries.</div>
          ) : (
            queued.map((q) => (
              <div key={q.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div>
                  <div className="font-semibold">{q.pickup_name} → {q.drop_name}</div>
                  <div className="text-xs text-muted-foreground">{q.units} unit{q.units && q.units > 1 ? 's' : ''} • ETA {q.eta_minutes} min</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDelete(q.id)}>Cancel</Button>
                  <Button size="sm" variant="hero" onClick={handleRetry}>Retry</Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 justify-end">
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}