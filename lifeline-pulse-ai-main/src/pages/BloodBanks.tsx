import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { BloodGroup, BloodBank } from '@/types/emergency';
import { useGeolocation } from '@/hooks/useGeolocation'; 
import { 
  MapPin, 
  Phone, 
  Clock, 
  Search, 
  Navigation,
  Building2,
  Droplet,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';

// Mock blood banks data
const mockBloodBanks: BloodBank[] = [
  {
    id: '1',
    name: 'City Central Blood Bank',
    address: '123 Main Street, Downtown',
    phone: '+91 98765 43210',
    location: { lat: 17.385, lng: 78.4867 },
    stock: { 'A+': 15, 'A-': 3, 'B+': 12, 'B-': 2, 'AB+': 5, 'AB-': 1, 'O+': 20, 'O-': 4 },
    operatingHours: '24/7',
    distance: 2.3,
  },
  {
    id: '2',
    name: 'Apollo Blood Center',
    address: '456 Hospital Road, Medical District',
    phone: '+91 98765 43211',
    location: { lat: 17.390, lng: 78.490 },
    stock: { 'A+': 8, 'A-': 1, 'B+': 6, 'B-': 0, 'AB+': 3, 'AB-': 0, 'O+': 10, 'O-': 2 },
    operatingHours: '8:00 AM - 10:00 PM',
    distance: 3.8,
  },
  {
    id: '3',
    name: 'Red Cross Blood Bank',
    address: '789 Charity Lane, NGO Zone',
    phone: '+91 98765 43212',
    location: { lat: 17.380, lng: 78.480 },
    stock: { 'A+': 25, 'A-': 5, 'B+': 18, 'B-': 3, 'AB+': 8, 'AB-': 2, 'O+': 30, 'O-': 6 },
    operatingHours: '24/7',
    distance: 4.5,
  },
  {
    id: '4',
    name: 'Government General Hospital',
    address: '321 Public Hospital Complex',
    phone: '+91 98765 43213',
    location: { lat: 17.375, lng: 78.475 },
    stock: { 'A+': 12, 'A-': 2, 'B+': 8, 'B-': 1, 'AB+': 4, 'AB-': 1, 'O+': 15, 'O-': 3 },
    operatingHours: '24/7',
    distance: 5.2,
  },
];

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodBanks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup | 'all'>('all');
  const { latitude, longitude, loading: locationLoading } = useGeolocation();

  const filteredBloodBanks = useMemo(() => {
    return mockBloodBanks
      .filter(bank => {
        const matchesSearch = bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             bank.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBloodGroup = selectedBloodGroup === 'all' || bank.stock[selectedBloodGroup] > 0;
        return matchesSearch && matchesBloodGroup;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [searchQuery, selectedBloodGroup]);

  const getStockStatus = (count: number) => {
    if (count === 0) return { label: 'Out', variant: 'critical' as const, icon: AlertCircle };
    if (count <= 3) return { label: 'Low', variant: 'warning' as const, icon: AlertCircle };
    return { label: 'Available', variant: 'stable' as const, icon: CheckCircle };
  };

  const openDirections = (bank: BloodBank) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bank.location.lat},${bank.location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge variant="urgent" className="mb-4">
            <MapPin className="w-3 h-3 mr-1" />
            {locationLoading ? 'Detecting Location...' : 'Location Detected'}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Blood Banks Near You
          </h1>
          <p className="text-muted-foreground">
            Find verified blood banks and hospitals with real-time stock information
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          className="max-w-3xl mx-auto mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search blood banks or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>

          {/* Blood Group Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <button
              onClick={() => setSelectedBloodGroup('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedBloodGroup === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              All Types
            </button>
            {bloodGroups.map(bg => (
              <button
                key={bg}
                onClick={() => setSelectedBloodGroup(bg)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedBloodGroup === bg
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredBloodBanks.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Droplet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No blood banks found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </motion.div>
          ) : (
            filteredBloodBanks.map((bank, index) => (
              <motion.div
                key={bank.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="elevated" className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{bank.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            {bank.address}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {bank.distance} km
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stock Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {bloodGroups.map(bg => {
                        const count = bank.stock[bg];
                        const status = getStockStatus(count);
                        const StatusIcon = status.icon;
                        
                        return (
                          <div
                            key={bg}
                            className={`p-2 rounded-lg text-center ${
                              selectedBloodGroup === bg ? 'ring-2 ring-primary' : ''
                            } ${
                              count === 0 ? 'bg-muted/50' : 'bg-muted'
                            }`}
                          >
                            <BloodTypeBadge bloodGroup={bg} size="sm" showIcon={false} />
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <StatusIcon className={`w-3 h-3 ${
                                status.variant === 'stable' ? 'text-status-stable' :
                                status.variant === 'warning' ? 'text-status-warning' :
                                'text-status-critical'
                              }`} />
                              <span className="text-xs font-medium">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Info & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {bank.operatingHours}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {bank.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${bank.phone}`, '_self')}
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openDirections(bank)}
                        >
                          <Navigation className="w-4 h-4" />
                          Directions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Offline Notice */}
        <motion.div
          className="max-w-3xl mx-auto mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            💡 This data is cached for offline access. Pull to refresh for latest stock information.
          </p>
        </motion.div>
      </div>
    </div>
  );
}    