-- Create favorites table with RLS
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (owner_id, generation_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "favorites_owner_select" ON public.favorites FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "favorites_owner_insert" ON public.favorites FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "favorites_owner_delete" ON public.favorites FOR DELETE 
  USING (auth.uid() = owner_id);

-- Indexes for performance
CREATE INDEX idx_favorites_owner_created ON public.favorites(owner_id, created_at DESC);