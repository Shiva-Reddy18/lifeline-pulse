import { useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import HospitalDashboardPage from './HospitalDashboardPage';
import Overview from './Overview';
import EmergencyRequests from './EmergencyRequests';
import EmergencyDetail from './EmergencyDetail';
import BloodCoordinationPanel from './BloodCoordinationPanel';
import LiveCaseTracking from './LiveCaseTracking';
import HistoryAndRecords from './HistoryAndRecords';
import NotificationsCenter from './NotificationsCenter';
import ProfileAndSettings from './ProfileAndSettings';
import HospitalHeader from './components/HospitalHeader';
import { useAuth } from '@/contexts/AuthContext';

export default function HospitalDashboardShell() {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth?redirect=/hospital', { replace: true });
        return;
      }

      if (!hasRole('hospital_staff')) {
        navigate('/', { replace: true });
        return;
      }
    }
  }, [user, loading, hasRole, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HospitalHeader />

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 pt-6 pb-12">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <nav className="sticky top-24 space-y-1">
              <NavLink to="/hospital" icon="📊">Overview</NavLink>
              <NavLink to="/hospital/requests" icon="🚨">Emergency Requests</NavLink>
              <NavLink to="/hospital/coordination" icon="🩸">Blood Coordination</NavLink>
              <NavLink to="/hospital/tracking" icon="📍">Live Case Tracking</NavLink>
              <NavLink to="/hospital/history" icon="📋">History & Records</NavLink>
              <NavLink to="/hospital/notifications" icon="🔔">Notifications</NavLink>
              <NavLink to="/hospital/profile" icon="⚙️">Profile & Settings</NavLink>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-120px)]">
            <Routes>
              <Route index element={<HospitalDashboardPage />} />
              <Route path="/" element={<HospitalDashboardPage />} />
              <Route path="overview" element={<Overview />} />
              <Route path="requests" element={<EmergencyRequests />} />
              <Route path="requests/:id" element={<EmergencyDetail />} />
              <Route path="coordination" element={<BloodCoordinationPanel />} />
              <Route path="tracking" element={<LiveCaseTracking />} />
              <Route path="history" element={<HistoryAndRecords />} />
              <Route path="notifications" element={<NotificationsCenter />} />
              <Route path="profile" element={<ProfileAndSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-4 py-2 rounded hover:bg-muted transition-colors text-sm font-medium"
    >
      <span className="mr-2">{icon}</span>
      {children}
    </Link>
  );
}
