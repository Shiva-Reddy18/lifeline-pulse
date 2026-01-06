import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut, User, Home } from 'lucide-react';
import { useState } from 'react';

export default function HospitalHeader() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [notificationCount] = useState(2);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-muted">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-10 w-10"
          >
            <Home className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">City Central Hospital</h2>
            <Badge variant="verified" className="text-xs">
              Admin Verified
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            onClick={() => navigate('/hospital/notifications')}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-status-critical rounded-full text-white text-xs flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Button>

          {/* Profile Dropdown */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => navigate('/hospital/profile')}
          >
            <User className="w-5 h-5" />
          </Button>

          {/* Logout */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
