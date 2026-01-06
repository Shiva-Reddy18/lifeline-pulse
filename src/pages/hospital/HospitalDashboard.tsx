import { Link, Navigate, Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut, Bell } from 'lucide-react';
import Overview from './Overview';
import EmergencyRequests from './EmergencyRequests';
import BloodCoordination from './BloodCoordination';
import LiveTracking from './LiveTracking';
import HistoryRecords from './HistoryRecords';
import Notifications from './Notifications';
import ProfileSettings from './ProfileSettings';

export default function HospitalDashboard() {
  const { hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  if (!hasRole('hospital_staff')) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold">Hospital Dashboard</h1>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium">City Central Hospital</h2>
                <Badge variant="verified" className="text-xs">Admin Verified</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/hospital/notifications')}>
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="space-y-2 sticky top-24">
            <SidebarLink to="overview">Overview</SidebarLink>
            <SidebarLink to="emergencies">Emergency Requests</SidebarLink>
            <SidebarLink to="blood">Blood Coordination</SidebarLink>
            <SidebarLink to="live">Live Case Tracking</SidebarLink>
            <SidebarLink to="history">History & Records</SidebarLink>
            <SidebarLink to="notifications">Notifications</SidebarLink>
            <SidebarLink to="profile">Profile & Settings</SidebarLink>
          </nav>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="emergencies" element={<EmergencyRequests />} />
            <Route path="blood" element={<BloodCoordination />} />
            <Route path="live" element={<LiveTracking />} />
            <Route path="history" element={<HistoryRecords />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="block px-3 py-2 rounded hover:bg-muted">
      {children}
    </Link>
  );
}
