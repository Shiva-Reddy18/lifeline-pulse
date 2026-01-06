import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Home, User, MapPin, Hospital as HospitalIcon,
  Menu, X, LogIn, LogOut, Shield, Droplet, LayoutDashboard,
  UserPlus, Building2, Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleLabels: Record<string, { label: string; icon: React.ElementType }> = {
  patient: { label: 'Patient', icon: User },
  donor: { label: 'Donor', icon: Droplet },
  hospital_staff: { label: 'Hospital', icon: HospitalIcon },
  blood_bank: { label: 'Blood Bank', icon: Building2 },
  volunteer: { label: 'Volunteer', icon: Truck },
  admin: { label: 'Admin', icon: Shield }
};

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ SAFE destructuring
  const auth = useAuth();

  const user = auth?.user;
  const signOut = auth?.signOut;
  const primaryRole = auth?.primaryRole;
  const getDashboardPath = auth?.getDashboardPath;

  const hasRole = (role: string) => primaryRole === role;

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/blood-banks', label: 'Blood Banks', icon: MapPin },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    if (!signOut) return;
    await signOut();
    navigate('/');
  };

  const RoleIcon =
    primaryRole && roleLabels[primaryRole]
      ? roleLabels[primaryRole].icon
      : User;

  const roleLabel =
    primaryRole && roleLabels[primaryRole]
      ? roleLabels[primaryRole].label
      : 'User';

  const goToDashboard = () => {
    if (!getDashboardPath) return;
    navigate(getDashboardPath());
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 glass border-b"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
            <div>
              <div className="font-bold">LIFELINE-X</div>
              <div className="text-xs text-muted-foreground">
                Emergency Blood Response
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-2">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}>
                <Button
                  size="sm"
                  variant={isActive(item.path) ? "default" : "ghost"}
                >
                  <item.icon className="w-4 h-4 mr-1" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <RoleIcon className="w-4 h-4 mr-2" />
                    {roleLabel}
                    <Badge className="ml-2">{roleLabel}</Badge>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{roleLabel} Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={goToDashboard}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    My Dashboard
                  </DropdownMenuItem>

                  {hasRole('donor') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/donor')}>
                      <Droplet className="w-4 h-4 mr-2" />
                      Donor Profile
                    </DropdownMenuItem>
                  )}

                  {hasRole('hospital_staff') && (
                    <DropdownMenuItem onClick={() => navigate('/hospital')}>
                      <HospitalIcon className="w-4 h-4 mr-2" />
                      Hospital Portal
                    </DropdownMenuItem>
                  )}

                  {hasRole('blood_bank') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/blood-bank')}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Blood Bank
                    </DropdownMenuItem>
                  )}

                  {hasRole('admin') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    <LogIn className="w-4 h-4 mr-1" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-1" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
