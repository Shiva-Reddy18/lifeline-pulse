import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { RoleSelector, UserRoleType } from '@/components/RoleSelector';
import { BloodGroup } from '@/types/emergency';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Droplet, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Heart,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Hospital,
  Building2
} from 'lucide-react';

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const roleRedirectMap: Record<UserRoleType, string> = {
  patient: '/dashboard/patient',
  donor: '/dashboard/donor',
  hospital_staff: '/hospital',
  blood_bank: '/dashboard/blood-bank',
  volunteer: '/dashboard/volunteer',
  admin: '/dashboard/admin'
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { toast } = useToast();
  
  // Step management
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRoleType | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    bloodGroup: '' as BloodGroup | '',
    address: '',
    lastDonation: '',
    emergencyContact: '',
    hospitalName: '',
    licenseNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check for role in URL params
  useEffect(() => {
    const roleParam = searchParams.get('type');
    if (roleParam && ['patient', 'donor', 'hospital_staff', 'blood_bank', 'volunteer', 'admin'].includes(roleParam)) {
      setSelectedRole(roleParam as UserRoleType);
      setStep('details');
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleRoleSelect = (role: UserRoleType) => {
    setSelectedRole(role);
  };

  const handleContinueToDetails = () => {
    if (selectedRole) {
      setStep('details');
    }
  };

  const handleBack = () => {
    setStep('role');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsSubmitting(true);

    try {
      // For demo purposes, skip actual signup and navigate directly
      // In production, this would require email confirmation
      
      toast({
        title: "Account Created!",
        description: "Welcome to LIFELINE-X. Redirecting to your dashboard..."
      });
      
      setIsSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(roleRedirectMap[selectedRole]);
      }, 2000);
      
    } catch (e) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-md mx-auto text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--status-stable)/0.1)] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[hsl(var(--status-stable))]" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-4">
              Registration Successful!
            </h1>
            <p className="text-muted-foreground mb-8">
              {selectedRole === 'donor' 
                ? 'Thank you for registering as a blood donor. You will be notified when your blood type is needed in emergencies near you.'
                : selectedRole === 'patient'
                ? 'Your patient profile has been created. You can now use one-tap emergency requests.'
                : selectedRole === 'hospital_staff'
                ? 'Your hospital staff account is pending verification. You will be notified once approved.'
                : 'Your account has been created. Redirecting to your dashboard...'}
            </p>
            <motion.div
              className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="urgent" className="mb-4">
              {step === 'role' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </Badge>
            <h1 className="text-3xl font-display font-bold mb-2">
              {step === 'role' ? 'Choose Your Role' : 'Complete Registration'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'role' 
                ? 'Select how you want to use LIFELINE-X'
                : `Register as ${selectedRole?.replace('_', ' ')}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'role' ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Role Selection Grid */}
                <RoleSelector 
                  selectedRole={selectedRole} 
                  onSelectRole={handleRoleSelect} 
                />

                {/* Continue Button */}
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="hero"
                    size="lg"
                    disabled={!selectedRole}
                    onClick={handleContinueToDetails}
                    className="gap-2 min-w-[200px]"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Login Link */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{' '}
                  <button 
                    onClick={() => navigate('/auth')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="details-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Back Button */}
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-4 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to role selection
                </Button>

                {/* Registration Form */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedRole === 'donor' && <Droplet className="w-5 h-5 text-primary" />}
                      {selectedRole === 'patient' && <User className="w-5 h-5 text-primary" />}
                      {selectedRole === 'hospital_staff' && <Hospital className="w-5 h-5 text-secondary" />}
                      {selectedRole === 'blood_bank' && <Building2 className="w-5 h-5 text-[hsl(var(--blood-ab))]" />}
                      {selectedRole === 'volunteer' && <Heart className="w-5 h-5 text-[hsl(var(--status-stable))]" />}
                      {selectedRole === 'admin' && <Shield className="w-5 h-5 text-[hsl(var(--status-warning))]" />}
                      {selectedRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Registration
                    </CardTitle>
                    <CardDescription>
                      Fill in your details to complete registration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="pl-10 pr-10"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="fullName"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      {/* Blood Group - for patient and donor */}
                      {(selectedRole === 'patient' || selectedRole === 'donor') && (
                        <div className="space-y-2">
                          <Label>Blood Group {selectedRole === 'donor' ? '(Required)' : '(Optional)'}</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {bloodGroups.map(bg => (
                              <button
                                key={bg}
                                type="button"
                                onClick={() => handleInputChange('bloodGroup', bg)}
                                className={`p-3 rounded-xl border-2 transition-all ${
                                  formData.bloodGroup === bg
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <BloodTypeBadge bloodGroup={bg} size="sm" showIcon={false} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="address">Address / Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="address"
                            placeholder="Your area or address"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Donor-specific fields */}
                      {selectedRole === 'donor' && (
                        <div className="space-y-2">
                          <Label htmlFor="lastDonation">Last Donation Date (Optional)</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="lastDonation"
                              type="date"
                              value={formData.lastDonation}
                              onChange={(e) => handleInputChange('lastDonation', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            We'll track your 3-month eligibility period
                          </p>
                        </div>
                      )}

                      {/* Patient-specific fields */}
                      {selectedRole === 'patient' && (
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContact">Emergency Contact</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="emergencyContact"
                              type="tel"
                              placeholder="Family member's phone"
                              value={formData.emergencyContact}
                              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      )}

                      {/* Hospital Staff specific fields */}
                      {selectedRole === 'hospital_staff' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="hospitalName">Hospital Name</Label>
                            <div className="relative">
                              <Hospital className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="hospitalName"
                                placeholder="Enter hospital name"
                                value={formData.hospitalName}
                                onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="licenseNumber">License Number</Label>
                            <Input
                              id="licenseNumber"
                              placeholder="Hospital license number"
                              value={formData.licenseNumber}
                              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                              required
                            />
                          </div>
                        </>
                      )}

                      {/* Blood Bank specific fields */}
                      {selectedRole === 'blood_bank' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="hospitalName">Blood Bank Name</Label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="hospitalName"
                                placeholder="Enter blood bank name"
                                value={formData.hospitalName}
                                onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="licenseNumber">License Number</Label>
                            <Input
                              id="licenseNumber"
                              placeholder="Blood bank license number"
                              value={formData.licenseNumber}
                              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                              required
                            />
                          </div>
                        </>
                      )}

                      {/* Privacy Notice */}
                      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                        <Shield className="w-5 h-5 text-primary mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">Your Privacy</p>
                          {selectedRole === 'donor' 
                            ? 'Your contact will only be shared with verified hospitals during emergencies. No spam, no patient direct contact.'
                            : selectedRole === 'patient'
                            ? 'Your information is secure. Only verified hospitals will handle your emergency requests.'
                            : 'Your information is encrypted and secure. We follow strict data protection guidelines.'}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        variant="hero"
                        className="w-full"
                        disabled={isSubmitting || !formData.email || !formData.password || !formData.fullName || !formData.phone || (selectedRole === 'donor' && !formData.bloodGroup)}
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Complete Registration
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
