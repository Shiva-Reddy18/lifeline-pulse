import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Mail,
  Lock,
  User,
  Phone,
  Droplet,
  Eye,
  EyeOff,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BloodGroup } from "@/types/emergency";

const bloodGroups: BloodGroup[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  /* ----------------------------------------
     🔁 EMAIL → DASHBOARD REDIRECT
  ---------------------------------------- */
  const redirectBasedOnEmail = (email: string) => {
    const lowerEmail = email.toLowerCase();

    if (lowerEmail === "admin@lifeline.com") {
      navigate("/dashboard/admin");
    } else if (lowerEmail === "donor@lifeline.com") {
      navigate("/dashboard/donor");
    } else if (lowerEmail === "hospital@lifeline.com") {
      navigate("/dashboard/blood-bank");
    } else {
      navigate("/dashboard/patient"); // patient default
    }
  };

  /* ----------------------------------------
     🔁 AUTO REDIRECT IF LOGGED IN
  ---------------------------------------- */
  useEffect(() => {
    if (user?.email) {
      redirectBasedOnEmail(user.email);
    }
  }, [user]);

  /* ----------------------------------------
     🧠 LOGIN / SIGNUP HANDLER
  ---------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        /* ---------- LOGIN ---------- */
        const { error } = await signIn(email, password);

        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Welcome back!",
          description: "Redirecting to your dashboard...",
        });

        redirectBasedOnEmail(email);
      } else {
        /* ---------- SIGN UP ---------- */
        const { error } = await signUp(email, password, {
          full_name: fullName,
          phone,
          blood_group: bloodGroup || null,
        });

        if (error) {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        /* ✅ SAVE PATIENT PROFILE LOCALLY (TEMP DB) */
        localStorage.setItem(
          "patientProfile",
          JSON.stringify({
            full_name: fullName,
            phone,
            blood_group: bloodGroup,
            location: "",
            emergency_contact: "",
            email,
          })
        );

        toast({
          title: "Account Created!",
          description: "Redirecting to your dashboard...",
        });

        redirectBasedOnEmail(email);
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------------------------
     🧩 UI
  ---------------------------------------- */
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome Back" : "Join LIFELINE-X"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {isLogin
                ? "Sign in to access your dashboard"
                : "Create an account to save lives"}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />

                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />

                  <Label>Blood Group</Label>
                  <Select
                    value={bloodGroup}
                    onValueChange={(v) => setBloodGroup(v as BloodGroup)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />

              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
