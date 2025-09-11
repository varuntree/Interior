-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "collections_owner_select" ON public.collections FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "collections_owner_insert" ON public.collections FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "collections_owner_update" ON public.collections FOR UPDATE 
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "collections_owner_delete" ON public.collections FOR DELETE 
  USING (auth.uid() = owner_id);

-- Create collection items junction table
CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, generation_id)
);

-- Enable RLS for collection_items
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collection_items
CREATE POLICY "collection_items_owner_select" ON public.collection_items FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "collection_items_owner_insert" ON public.collection_items FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "collection_items_owner_delete" ON public.collection_items FOR DELETE 
  USING (auth.uid() = owner_id);

-- Indexes for performance
CREATE INDEX idx_collections_owner ON public.collections(owner_id);
CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id, created_at DESC);

