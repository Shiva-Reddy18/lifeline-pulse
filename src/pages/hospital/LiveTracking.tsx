import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function LiveTracking() {
  const [cases] = useState([/* sample cases omitted for brevity */]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Live Case Tracking</h2>
      <Card>
        <CardHeader>
          <CardTitle>Active Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Live map and ETA tracking would render here (use `src/hooks/useGeolocation.tsx` and `react-leaflet` / `mapbox-gl`).</div>
        </CardContent>
      </Card>
    </div>
  );
}
