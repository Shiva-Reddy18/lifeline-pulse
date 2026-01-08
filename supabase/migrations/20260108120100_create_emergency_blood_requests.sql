-- Migration: create emergency_blood_requests table and link to blood units

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('created', 'flagged', 'active', 'hospital_verified', 'fulfilled', 'expired', 'auto_closed');

-- Create emergency_blood_requests table
CREATE TABLE IF NOT EXISTS public.emergency_blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  blood_group public.blood_group NOT NULL,
  units_required INTEGER NOT NULL,
  status public.request_status DEFAULT 'created',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  hospital_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hospital_name TEXT,
  units_fulfilled INTEGER DEFAULT 0,
  priority_level public.urgency_level DEFAULT 'stable',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.emergency_blood_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.emergency_blood_requests IS 'Tracks emergency blood requests from patients/hospitals.';
COMMENT ON COLUMN public.emergency_blood_requests.units_required IS 'Total blood units needed for this request';
COMMENT ON COLUMN public.emergency_blood_requests.units_fulfilled IS 'Number of blood units already allocated/fulfilled';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON public.emergency_blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_blood_group ON public.emergency_blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_hospital_id ON public.emergency_blood_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_patient_id ON public.emergency_blood_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_created_at ON public.emergency_blood_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_priority ON public.emergency_blood_requests(priority_level);

-- Create junction table to link blood units to emergency requests
CREATE TABLE IF NOT EXISTS public.blood_unit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_unit_id UUID NOT NULL REFERENCES public.blood_units(id) ON DELETE CASCADE,
  emergency_request_id UUID NOT NULL REFERENCES public.emergency_blood_requests(id) ON DELETE CASCADE,
  allocation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fulfillment_timestamp TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT DEFAULT 'pending', -- pending, in_transit, delivered, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(blood_unit_id, emergency_request_id)
);

ALTER TABLE public.blood_unit_allocations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.blood_unit_allocations IS 'Links blood units to emergency requests they fulfill.';

CREATE INDEX IF NOT EXISTS idx_allocations_unit_id ON public.blood_unit_allocations(blood_unit_id);
CREATE INDEX IF NOT EXISTS idx_allocations_request_id ON public.blood_unit_allocations(emergency_request_id);
CREATE INDEX IF NOT EXISTS idx_allocations_delivery_status ON public.blood_unit_allocations(delivery_status);

-- Trigger to update emergency_blood_requests updated_at
CREATE OR REPLACE FUNCTION public.set_emergency_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_requests_updated_at_trigger ON public.emergency_blood_requests;
CREATE TRIGGER emergency_requests_updated_at_trigger
BEFORE UPDATE ON public.emergency_blood_requests
FOR EACH ROW
EXECUTE PROCEDURE public.set_emergency_requests_updated_at();

-- Function to calculate units_fulfilled from allocations
CREATE OR REPLACE FUNCTION public.update_units_fulfilled()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.emergency_blood_requests
    SET units_fulfilled = (
      SELECT COUNT(*) FROM public.blood_unit_allocations
      WHERE emergency_request_id = NEW.emergency_request_id
    )
    WHERE id = NEW.emergency_request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.emergency_blood_requests
    SET units_fulfilled = (
      SELECT COUNT(*) FROM public.blood_unit_allocations
      WHERE emergency_request_id = OLD.emergency_request_id
    )
    WHERE id = OLD.emergency_request_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fulfilled_count_trigger ON public.blood_unit_allocations;
CREATE TRIGGER update_fulfilled_count_trigger
AFTER INSERT OR DELETE ON public.blood_unit_allocations
FOR EACH ROW
EXECUTE PROCEDURE public.update_units_fulfilled();

-- RLS Policies for emergency_blood_requests
CREATE POLICY "Users can view all emergency requests"
ON public.emergency_blood_requests FOR SELECT
USING (true);

CREATE POLICY "Hospitals can create emergency requests"
ON public.emergency_blood_requests FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'hospital_staff')
);

CREATE POLICY "Request creators can update their requests"
ON public.emergency_blood_requests FOR UPDATE
USING (auth.uid() = user_id OR hospital_id = auth.uid());

-- RLS Policies for blood_unit_allocations
CREATE POLICY "Users can view allocations"
ON public.blood_unit_allocations FOR SELECT
USING (true);

CREATE POLICY "Blood banks and admins can create allocations"
ON public.blood_unit_allocations FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('blood_bank', 'admin'))
);

CREATE POLICY "Admins can update allocations"
ON public.blood_unit_allocations FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
