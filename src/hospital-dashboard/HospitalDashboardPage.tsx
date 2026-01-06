import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hospital, ArrowRight, Gauge, AlertTriangle, Droplet, Clock, FileText, Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HospitalDashboard() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Overview',
      icon: Gauge,
      description: 'Quick situational awareness & readiness metrics',
      path: '/hospital/overview',
      color: 'from-blue-500/10 to-blue-600/10'
    },
    {
      title: 'Emergency Requests',
      icon: AlertTriangle,
      description: 'Manage incoming emergencies with admin approval',
      path: '/hospital/requests',
      color: 'from-red-500/10 to-red-600/10'
    },
    {
      title: 'Blood Coordination',
      icon: Droplet,
      description: 'Blood sourcing & allocation without donor contact',
      path: '/hospital/coordination',
      color: 'from-pink-500/10 to-pink-600/10'
    },
    {
      title: 'Live Case Tracking',
      icon: Clock,
      description: 'Real-time GPS tracking & case progress',
      path: '/hospital/tracking',
      color: 'from-green-500/10 to-green-600/10'
    },
    {
      title: 'History & Records',
      icon: FileText,
      description: 'Immutable audit logs with exports',
      path: '/hospital/history',
      color: 'from-purple-500/10 to-purple-600/10'
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Real-time alerts + offline sync',
      path: '/hospital/notifications',
      color: 'from-orange-500/10 to-orange-600/10'
    },
    {
      title: 'Profile & Settings',
      icon: Settings,
      description: 'Hospital identity & preferences',
      path: '/hospital/profile',
      color: 'from-cyan-500/10 to-cyan-600/10'
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge variant="verified" className="mb-4 inline-flex gap-2">
            <Hospital className="w-3 h-3" />
            Hospital Staff Dashboard
          </Badge>
          <h1 className="text-4xl font-display font-bold mt-4 mb-3">
            Hospital Staff Dashboard
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage emergency blood requests, coordinate donors, track cases in real-time, and maintain complete audit records.
          </p>
        </motion.div>

        {/* Navigation Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  variant="elevated"
                  className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all h-full"
                  onClick={() => navigate(section.path)}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between group"
                      onClick={() => navigate(section.path)}
                    >
                      <span>Open</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Help Section */}
        <motion.div
          className="mt-12 p-6 rounded-lg border bg-muted/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-semibold mb-2">Quick Start Guide</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Start with <strong>Overview</strong> to check current hospital status</li>
            <li>Visit <strong>Emergency Requests</strong> to manage incoming emergencies (requires admin approval)</li>
            <li>Use <strong>Blood Coordination</strong> to allocate blood without contacting donors</li>
            <li>Monitor <strong>Live Case Tracking</strong> for real-time progress updates</li>
            <li>Review <strong>History & Records</strong> for compliance and auditing</li>
            <li>Check <strong>Notifications</strong> for alerts and updates</li>
            <li>Manage your settings in <strong>Profile & Settings</strong></li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
