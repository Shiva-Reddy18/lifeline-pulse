import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Home, 
  User, 
  MapPin, 
  Hospital as HospitalIcon,
  Menu,
  X,
  LogIn,
  LogOut,
  Shield,
  Droplet,
  LayoutDashboard,
  UserPlus,
  Building2,
  Truck
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
  attender: { label: 'Attender', icon: User },
  donor: { label: 'Donor', icon: Droplet },
  hospital_staff: { label: 'Hospital', icon: HospitalIcon },
  blood_bank: { label: 'Blood Bank', icon: Building2 },
  volunteer: { label: 'Volunteer', icon: Truck },
  transport: { label: 'Transport', icon: Truck },
  admin: { label: 'Admin', icon: Shield }
};

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, hasRole, primaryRole, getDashboardPath, loading } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/blood-banks', label: 'Blood Banks', icon: MapPin },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // effectiveRole: prefer user.role if AuthContext attached it, else use primaryRole
  const effectiveRole = (user && ((user as any).role ?? primaryRole)) ?? null;
  // normalize to string or null
  const normalizedRole = typeof effectiveRole === 'string' ? effectiveRole : null;

  const RoleIcon = normalizedRole ? (roleLabels[normalizedRole]?.icon || User) : User;
  const roleLabel = normalizedRole ? (roleLabels[normalizedRole]?.label || 'User') : 'User';

  // helper to handle fast UI even if roles[] hasn't arrived yet
  const hasRoleFast = (roleName: string) => {
    // check normalizedRole first (fast), else fallback to hasRole()
    if (normalizedRole) return normalizedRole === roleName;
    return hasRole(roleName as any);
  };

  // decide dashboard navigation — don't navigate using getDashboardPath() if primaryRole not yet known
  const handleGoToDashboard = () => {
    if (loading) return; // do nothing until roles are loaded
    const path = getDashboardPath();
    navigate(path);
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
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className="w-6 h-6 text-primary-foreground fill-current" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-tight">LIFELINE-X</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Emergency Blood Response</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Auth & Emergency CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <RoleIcon className="w-4 h-4" />
                    <span>{roleLabel}</span>
                    <Badge variant="secondary" className="ml-1 text-xs py-0">
                      {roleLabel}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <RoleIcon className="w-4 h-4" />
                    {roleLabel} Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleGoToDashboard} disabled={loading}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    My Dashboard
                  </DropdownMenuItem>

                  {hasRoleFast('donor') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/donor')}>
                      <Droplet className="w-4 h-4 mr-2" />
                      Donor Profile
                    </DropdownMenuItem>
                  )}
                  {hasRoleFast('hospital_staff') && (
                    <DropdownMenuItem onClick={() => navigate('/hospital')}>
                      <HospitalIcon className="w-4 h-4 mr-2" />
                      Hospital Portal
                    </DropdownMenuItem>
                  )}
                  {hasRoleFast('blood_bank') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/blood-bank')}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Blood Bank
                    </DropdownMenuItem>
                  )}
                  {hasRoleFast('admin') && (
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
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="hero-outline" size="sm" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Register
                  </Button>
                </Link>
              </div>
            )}
            <Link to="/">
              <Button variant="emergency-outline" size="sm">
                <Heart className="w-4 h-4" />
                Emergency
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden border-t bg-background"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <RoleIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{roleLabel}</span>
                  <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
                </div>
                <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3" disabled={loading}>
                    <LayoutDashboard className="w-5 h-5" />
                    My Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3"
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="hero-outline" className="w-full justify-start gap-3">
                    <UserPlus className="w-5 h-5" />
                    Register
                  </Button>
                </Link>
              </>
            )}
            
            <div className="pt-2 border-t">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="emergency" className="w-full">
                  <Heart className="w-5 h-5" />
                  EMERGENCY
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
