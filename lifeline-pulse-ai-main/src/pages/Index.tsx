import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { EmergencyButton } from '@/components/EmergencyButton';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGeolocation } from '@/hooks/useGeolocation';
import { BloodGroup } from '@/types/emergency';
import { 
  MapPin, 
  Clock, 
  Shield, 
  Heart, 
  Users, 
  Hospital,
  Droplet,
  Phone,
  ArrowRight,
  CheckCircle,
  Zap
} from 'lucide-react';

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Index() {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { latitude, longitude, loading: locationLoading, error: locationError } = useGeolocation();

  const handleEmergencyTrigger = () => {
    setShowEmergencyModal(true);
  };

  const handleEmergencySubmit = async () => {
    if (!selectedBloodGroup) return;
    
    setIsProcessing(true);
    // Simulate request creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setShowEmergencyModal(false);
    navigate('/status/demo-request');
  };

  const stats = [
    { value: '24/7', label: 'Available', icon: Clock },
    { value: '500+', label: 'Hospitals', icon: Hospital },
    { value: '10K+', label: 'Donors', icon: Users },
    { value: '< 2hr', label: 'Response', icon: Zap },
  ];

  const features = [
    {
      icon: Heart,
      title: 'One-Tap Emergency',
      description: 'No forms, no typing. Just tap and help arrives.',
    },
    {
      icon: Shield,
      title: 'Hospital Verified',
      description: 'All blood flows through verified hospitals only.',
    },
    {
      icon: MapPin,
      title: 'Auto Location',
      description: 'GPS-powered to find nearest blood sources.',
    },
    {
      icon: Phone,
      title: 'Offline Ready',
      description: 'Works even with limited connectivity.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        
        {/* Decorative elements */}
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="urgent" className="mb-4">
                🩸 Emergency Blood Response System
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Every Second Counts.{' '}
              <span className="gradient-text">Save Lives.</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              One-tap emergency blood requests. Hospital-verified. 
              No donor direct contact. Designed for panic situations.
            </motion.p>

            {/* Location Status */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-8 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MapPin className="w-4 h-4 text-primary" />
              {locationLoading ? (
                <span className="text-muted-foreground">Detecting location...</span>
              ) : locationError ? (
                <span className="text-destructive">{locationError}</span>
              ) : (
                <span className="text-muted-foreground">
                  Location detected: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                </span>
              )}
            </motion.div>
          </div>

          {/* Emergency Button */}
          <motion.div
            className="flex justify-center mb-16"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <EmergencyButton onTrigger={handleEmergencyTrigger} />
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} variant="glass" className="text-center p-4">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </Card>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Built for Emergencies
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              LIFELINE-X is designed for real panic situations — accidents, dengue, surgery. 
              No complexity. Just one tap.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="elevated" className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Register as Donor */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card variant="elevated" className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Droplet className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Become a Donor</CardTitle>
                      <p className="text-sm text-muted-foreground">Save lives with your blood</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {bloodGroups.map(bg => (
                      <BloodTypeBadge key={bg} bloodGroup={bg} size="sm" showIcon={false} />
                    ))}
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-stable" />
                      Get notified for emergencies near you
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-stable" />
                      3-month eligibility tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-stable" />
                      Hospital-only contact (no spam)
                    </li>
                  </ul>
                  <Button 
                    variant="hero-outline" 
                    className="w-full gap-2"
                    onClick={() => navigate('/register?type=donor')}
                  >
                    Register as Donor
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Find Blood Banks */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card variant="elevated" className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <CardTitle>Find Blood Banks</CardTitle>
                      <p className="text-sm text-muted-foreground">Locate nearest blood sources</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      View nearby hospitals and blood banks with real-time stock information
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-stable" />
                      Works offline with cached data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-stable" />
                      Real-time availability
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-status-stable" />
                      Distance & ETA calculation
                    </li>
                  </ul>
                  <Button 
                    variant="medical" 
                    className="w-full gap-2"
                    onClick={() => navigate('/blood-banks')}
                  >
                    View Blood Banks
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && setShowEmergencyModal(false)}
          >
            <motion.div
              className="w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <Card variant="emergency" className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary animate-heartbeat" />
                  </div>
                  <h2 className="text-2xl font-display font-bold">Emergency Request</h2>
                  <p className="text-muted-foreground mt-2">
                    Select blood group to continue
                  </p>
                </div>

                {/* Blood group selection */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {bloodGroups.map(bg => (
                    <button
                      key={bg}
                      onClick={() => setSelectedBloodGroup(bg)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedBloodGroup === bg
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <BloodTypeBadge bloodGroup={bg} size="sm" showIcon={false} />
                    </button>
                  ))}
                </div>

                {/* Location status */}
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-6">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div className="flex-1 text-sm">
                    {locationLoading ? 'Detecting location...' : 
                     locationError ? 'Location unavailable' :
                     'Location detected'}
                  </div>
                  {!locationLoading && !locationError && (
                    <CheckCircle className="w-5 h-5 text-status-stable" />
                  )}
                </div>

                {/* Submit button */}
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!selectedBloodGroup || isProcessing}
                  onClick={handleEmergencySubmit}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Creating Request...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      Send Emergency Request
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Your request will be routed to the nearest verified hospitals
                </p>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
