-- Migration: add volunteers, deliveries, delivery_events
-- Created: 2026-01-07

-- =============================================
-- VOLUNTEERS TABLE
-- =============================================
CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  phone TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  total_deliveries INTEGER DEFAULT 0,
  on_time_rate DOUBLE PRECISION DEFAULT 0,
  rating DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Basic policies: users can read their own volunteer row and update it
CREATE POLICY "Users can select their volunteer row"
  ON public.volunteers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert volunteer row"
  ON public.volunteers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their volunteer row"
  ON public.volunteers FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteers;

-- =============================================
-- DELIVERIES TABLE
-- =============================================
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
  assigned_volunteer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blood_group TEXT,
  units INTEGER,
  priority TEXT DEFAULT 'normal',
  pickup_name TEXT,
  pickup_address TEXT,
  drop_name TEXT,
  drop_address TEXT,
  contact_phone TEXT,
  distance_km DOUBLE PRECISION,
  eta_minutes INTEGER,
  status TEXT DEFAULT 'pending',
  rating DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Volunteers can view deliveries assigned to them (via volunteer_id -> volunteers.user_id OR assigned_volunteer_id)
CREATE POLICY "Volunteers can view deliveries assigned to them"
  ON public.deliveries FOR SELECT TO authenticated
  USING (
    volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid())
    OR assigned_volunteer_id = auth.uid()
  );

-- Allow volunteers to update status for deliveries assigned to them
CREATE POLICY "Volunteers can update their deliveries"
  ON public.deliveries FOR UPDATE TO authenticated
  USING (
    volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid())
    OR assigned_volunteer_id = auth.uid()
  )
  WITH CHECK (true);

-- Allow insert for authenticated users (can be tightened later)
CREATE POLICY "Allow insert for authenticated users"
  ON public.deliveries FOR INSERT TO authenticated
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;

-- =============================================
-- DELIVERY EVENTS TABLE
-- =============================================
CREATE TABLE public.delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
  event TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteers can view events for their deliveries"
  ON public.delivery_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.id = public.delivery_events.delivery_id
      AND (
        d.volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid())
        OR d.assigned_volunteer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Allow insert delivery events"
  ON public.delivery_events FOR INSERT TO authenticated
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_events;

-- Optionally: create helpful indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_volunteer_id ON public.deliveries(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_assigned_volunteer_id ON public.deliveries(assigned_volunteer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery_id ON public.delivery_events(delivery_id);
