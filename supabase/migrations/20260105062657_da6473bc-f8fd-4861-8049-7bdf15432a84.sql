-- =============================================
-- LIFELINE-X DATABASE SCHEMA
-- Emergency Blood Response System
-- =============================================

-- Create enum for user roles (stored separately for security)
CREATE TYPE public.app_role AS ENUM ('patient', 'attender', 'donor', 'hospital_staff', 'blood_bank', 'volunteer', 'transport', 'admin');

-- Create enum for blood groups
CREATE TYPE public.blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Create enum for emergency status
CREATE TYPE public.emergency_status AS ENUM ('created', 'hospital_verified', 'accepted', 'in_transit', 'fulfilled', 'auto_closed', 'expired');

-- Create enum for urgency level
CREATE TYPE public.urgency_level AS ENUM ('stable', 'warning', 'critical');

-- Create enum for condition type
CREATE TYPE public.condition_type AS ENUM ('trauma', 'surgery', 'dengue', 'other');

-- =============================================
-- USER ROLES TABLE (CRITICAL FOR SECURITY)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  blood_group blood_group,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  address TEXT,
  avatar_url TEXT,
  language_preference TEXT DEFAULT 'en',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, blood_group)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'User'),
    new.raw_user_meta_data ->> 'phone',
    CASE WHEN new.raw_user_meta_data ->> 'blood_group' IS NOT NULL 
         THEN (new.raw_user_meta_data ->> 'blood_group')::blood_group 
         ELSE NULL END
  );
  
  -- Assign default patient role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'patient');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- HOSPITALS TABLE
-- =============================================
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  license_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  blood_stock JSONB DEFAULT '{"A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0}'::jsonb,
  operating_hours TEXT DEFAULT '24/7',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified hospitals"
ON public.hospitals FOR SELECT
USING (is_verified = true AND is_active = true);

CREATE POLICY "Hospital staff can manage their hospital"
ON public.hospitals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'hospital_staff') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- HOSPITAL STAFF ASSIGNMENTS
-- =============================================
CREATE TABLE public.hospital_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, hospital_id)
);

ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view their assignments"
ON public.hospital_staff FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- BLOOD BANKS TABLE
-- =============================================
CREATE TABLE public.blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  license_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stock JSONB DEFAULT '{"A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0}'::jsonb,
  operating_hours TEXT DEFAULT '24/7',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active blood banks"
ON public.blood_banks FOR SELECT
USING (is_active = true);

CREATE POLICY "Blood bank staff can manage"
ON public.blood_banks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'blood_bank') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- DONORS TABLE
-- =============================================
CREATE TABLE public.donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  blood_group blood_group NOT NULL,
  last_donation_date DATE,
  total_donations INTEGER DEFAULT 0,
  is_eligible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  credibility_score INTEGER DEFAULT 100,
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view and manage their own record"
ON public.donors FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Hospital staff can view eligible donors"
ON public.donors FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'hospital_staff') AND is_eligible = true AND is_active = true AND is_blacklisted = false);

CREATE POLICY "Admins can manage all donors"
ON public.donors FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to check 3-month donation eligibility
CREATE OR REPLACE FUNCTION public.check_donor_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.last_donation_date IS NOT NULL THEN
    NEW.is_eligible := (CURRENT_DATE - NEW.last_donation_date) >= 90;
  ELSE
    NEW.is_eligible := true;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_donor_eligibility
  BEFORE INSERT OR UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.check_donor_eligibility();

-- =============================================
-- EMERGENCY REQUESTS TABLE
-- =============================================
CREATE TABLE public.emergencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  blood_group blood_group NOT NULL,
  units_required INTEGER NOT NULL DEFAULT 1,
  condition condition_type NOT NULL DEFAULT 'other',
  condition_details TEXT,
  status emergency_status NOT NULL DEFAULT 'created',
  urgency_level urgency_level NOT NULL DEFAULT 'stable',
  criticality_score DOUBLE PRECISION DEFAULT 0,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  location_address TEXT,
  hospital_id UUID REFERENCES public.hospitals(id),
  accepted_by_hospital_at TIMESTAMP WITH TIME ZONE,
  assigned_donor_id UUID REFERENCES public.donors(id),
  assigned_volunteer_id UUID REFERENCES auth.users(id),
  estimated_arrival_minutes INTEGER,
  verification_otp TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  auto_closed_at TIMESTAMP WITH TIME ZONE,
  escalation_level INTEGER DEFAULT 0,
  audit_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;

-- Enable realtime for emergencies
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;

CREATE POLICY "Patients can view their own emergencies"
ON public.emergencies FOR SELECT TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Hospital staff can view and manage emergencies"
ON public.emergencies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'hospital_staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Donors can view emergencies they are assigned to"
ON public.emergencies FOR SELECT TO authenticated
USING (assigned_donor_id IN (SELECT id FROM public.donors WHERE user_id = auth.uid()));

CREATE POLICY "Volunteers can view emergencies they are assigned to"
ON public.emergencies FOR SELECT TO authenticated
USING (assigned_volunteer_id = auth.uid());

CREATE POLICY "Allow insert for authenticated users"
ON public.emergencies FOR INSERT TO authenticated
WITH CHECK (true);

-- Function to set expiry and calculate criticality
CREATE OR REPLACE FUNCTION public.set_emergency_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rarity_score DOUBLE PRECISION;
  condition_score DOUBLE PRECISION;
  time_score DOUBLE PRECISION := 0;
  base_criticality DOUBLE PRECISION;
BEGIN
  -- Set expiry to 4 hours from creation
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '4 hours';
  END IF;
  
  -- Calculate rarity score based on blood group
  rarity_score := CASE NEW.blood_group
    WHEN 'AB-' THEN 0.994
    WHEN 'B-' THEN 0.985
    WHEN 'AB+' THEN 0.966
    WHEN 'A-' THEN 0.937
    WHEN 'O-' THEN 0.934
    WHEN 'B+' THEN 0.915
    WHEN 'A+' THEN 0.691
    WHEN 'O+' THEN 0.626
    ELSE 0.5
  END;
  
  -- Calculate condition score
  condition_score := CASE NEW.condition
    WHEN 'trauma' THEN 1.0
    WHEN 'dengue' THEN 0.9
    WHEN 'surgery' THEN 0.7
    ELSE 0.5
  END;
  
  -- Calculate base criticality
  base_criticality := (rarity_score * 0.4 + condition_score * 0.6) * 100;
  NEW.criticality_score := base_criticality;
  
  -- Set urgency level
  IF base_criticality >= 70 THEN
    NEW.urgency_level := 'critical';
  ELSIF base_criticality >= 40 THEN
    NEW.urgency_level := 'warning';
  ELSE
    NEW.urgency_level := 'stable';
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_emergency_defaults_trigger
  BEFORE INSERT ON public.emergencies
  FOR EACH ROW EXECUTE FUNCTION public.set_emergency_defaults();

-- =============================================
-- EMERGENCY RESPONSES (DONOR RESPONSES)
-- =============================================
CREATE TABLE public.emergency_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES public.emergencies(id) ON DELETE CASCADE NOT NULL,
  donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('accepted', 'declined', 'no_response')),
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  UNIQUE (emergency_id, donor_id)
);

ALTER TABLE public.emergency_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can manage their responses"
ON public.emergency_responses FOR ALL TO authenticated
USING (donor_id IN (SELECT id FROM public.donors WHERE user_id = auth.uid()));

CREATE POLICY "Hospital staff can view responses"
ON public.emergency_responses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'hospital_staff') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- LIVE TRACKING TABLE
-- =============================================
CREATE TABLE public.live_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES public.emergencies(id) ON DELETE CASCADE NOT NULL,
  tracker_type TEXT NOT NULL CHECK (tracker_type IN ('donor', 'volunteer', 'blood_unit')),
  tracker_user_id UUID REFERENCES auth.users(id),
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  eta_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.live_tracking ENABLE ROW LEVEL SECURITY;

-- Enable realtime for tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_tracking;

CREATE POLICY "Tracking visible to emergency participants"
ON public.live_tracking FOR SELECT TO authenticated
USING (
  emergency_id IN (
    SELECT id FROM public.emergencies 
    WHERE patient_id = auth.uid() 
       OR assigned_donor_id IN (SELECT id FROM public.donors WHERE user_id = auth.uid())
       OR assigned_volunteer_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'hospital_staff')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Trackers can update their location"
ON public.live_tracking FOR ALL TO authenticated
USING (tracker_user_id = auth.uid());

-- =============================================
-- CHAT MESSAGES (FOR CHATBOT)
-- =============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  is_emergency_detected BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chat messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert chat messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Anonymous chat allowed"
ON public.chat_messages FOR ALL
USING (user_id IS NULL);

-- =============================================
-- AUDIT LOG TABLE
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role app_role,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- =============================================
-- DONATION HISTORY
-- =============================================
CREATE TABLE public.donation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
  emergency_id UUID REFERENCES public.emergencies(id),
  hospital_id UUID REFERENCES public.hospitals(id),
  blood_group blood_group NOT NULL,
  units_donated INTEGER DEFAULT 1,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.donation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view their donation history"
ON public.donation_history FOR SELECT TO authenticated
USING (donor_id IN (SELECT id FROM public.donors WHERE user_id = auth.uid()));

CREATE POLICY "Hospital staff can manage donations"
ON public.donation_history FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'hospital_staff') OR public.has_role(auth.uid(), 'admin'));

-- Trigger to update donor stats after donation
CREATE OR REPLACE FUNCTION public.update_donor_after_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.donors
  SET 
    last_donation_date = NEW.donation_date,
    total_donations = total_donations + NEW.units_donated
  WHERE id = NEW.donor_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_donation_insert
  AFTER INSERT ON public.donation_history
  FOR EACH ROW EXECUTE FUNCTION public.update_donor_after_donation();

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  emergency_id UUID REFERENCES public.emergencies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_emergencies_status ON public.emergencies(status);
CREATE INDEX idx_emergencies_blood_group ON public.emergencies(blood_group);
CREATE INDEX idx_emergencies_urgency ON public.emergencies(urgency_level);
CREATE INDEX idx_emergencies_location ON public.emergencies(location_lat, location_lng);
CREATE INDEX idx_donors_blood_group ON public.donors(blood_group);
CREATE INDEX idx_donors_eligible ON public.donors(is_eligible, is_active, is_blacklisted);
CREATE INDEX idx_live_tracking_emergency ON public.live_tracking(emergency_id, is_active);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);