-- 1. Kennzeichen in der Artikel-Tabelle hinzufügen, ob es ein Bundle ist
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false;

-- 2. Verknüpfungstabelle für die Bundle-Inhalte erstellen
CREATE TABLE IF NOT EXISTS public.bundle_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bundle_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS für die neue Tabelle aktivieren
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Richtlinien für lokalen Netzwerkbetrieb (vollständiger Lese-/Schreibzugriff)
DROP POLICY IF EXISTS "Allow all actions for bundle_items" ON public.bundle_items;
CREATE POLICY "Allow all actions for bundle_items" ON public.bundle_items 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3. Stored Procedure zum atomaren Erstellen eines Bundles
CREATE OR REPLACE FUNCTION public.create_bundle(
  p_name text,
  p_sku text,
  p_description text,
  p_herstellpreis numeric,
  p_verkaufspreis numeric,
  p_purchase_price numeric,
  p_lagerort text,
  p_unit text,
  p_tax_rate numeric,
  p_items jsonb
) RETURNS uuid AS $$
DECLARE
  v_new_bundle_id uuid;
  v_item jsonb;
  v_article_id uuid;
  v_quantity integer;
  v_current_bestand numeric;
  v_article_name text;
BEGIN
  -- Check stock for all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_article_id := (v_item->>'article_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    SELECT bestand, name INTO v_current_bestand, v_article_name 
    FROM public.articles 
    WHERE id = v_article_id;
    
    IF v_current_bestand IS NULL THEN
      RAISE EXCEPTION 'Artikel mit ID % existiert nicht.', v_article_id;
    END IF;
    
    IF v_current_bestand < v_quantity THEN
      RAISE EXCEPTION 'Nicht genügend Bestand für Artikel "%". Benötigt: %, Vorhanden: %', 
        v_article_name, v_quantity, v_current_bestand;
    END IF;
  END LOOP;

  -- Create the bundle article
  INSERT INTO public.articles (
    name, sku, description, herstellpreis, verkaufspreis, purchase_price, 
    bestand, mindestbestand, lagerort, unit, tax_rate, is_bundle
  ) VALUES (
    p_name, p_sku, p_description, p_herstellpreis, p_verkaufspreis, p_purchase_price, 
    1, 0, p_lagerort, p_unit, p_tax_rate, true
  ) RETURNING id INTO v_new_bundle_id;

  -- Log history for the bundle itself
  INSERT INTO public.article_history (
    article_id, old_stock, new_stock, type, amount
  ) VALUES (
    v_new_bundle_id, 0, 1, 'input', 1
  );

  -- Process each component item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_article_id := (v_item->>'article_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    -- Get current stock
    SELECT bestand INTO v_current_bestand 
    FROM public.articles 
    WHERE id = v_article_id;

    -- Update stock
    UPDATE public.articles 
    SET bestand = v_current_bestand - v_quantity 
    WHERE id = v_article_id;

    -- Log history for component
    INSERT INTO public.article_history (
      article_id, old_stock, new_stock, type, amount
    ) VALUES (
      v_article_id, v_current_bestand, v_current_bestand - v_quantity, 'output', -v_quantity
    );

    -- Link in bundle_items
    INSERT INTO public.bundle_items (
      bundle_id, article_id, quantity
    ) VALUES (
      v_new_bundle_id, v_article_id, v_quantity
    );
  END LOOP;

  -- Log activity
  INSERT INTO public.activity_logs (
    type, message, article_id, payload
  ) VALUES (
    'create', 
    'Artikel-Bundle "' || p_name || '" wurde neu angelegt und die Komponenten abgebucht', 
    v_new_bundle_id, 
    jsonb_build_object('name', p_name, 'sku', p_sku, 'items', p_items)
  );

  RETURN v_new_bundle_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Stored Procedure zum atomaren Auflösen eines Bundles
CREATE OR REPLACE FUNCTION public.disband_bundle(
  p_bundle_id uuid
) RETURNS void AS $$
DECLARE
  v_bundle_name text;
  v_item record;
  v_current_bestand numeric;
BEGIN
  -- Check if the bundle exists and is a bundle
  SELECT name INTO v_bundle_name 
  FROM public.articles 
  WHERE id = p_bundle_id AND is_bundle = true;
  
  IF v_bundle_name IS NULL THEN
    RAISE EXCEPTION 'Bundle mit ID % existiert nicht.', p_bundle_id;
  END IF;

  -- Return components to stock
  FOR v_item IN 
    SELECT article_id, quantity 
    FROM public.bundle_items 
    WHERE bundle_id = p_bundle_id
  LOOP
    SELECT bestand INTO v_current_bestand 
    FROM public.articles 
    WHERE id = v_item.article_id;
    
    -- Update stock
    UPDATE public.articles 
    SET bestand = v_current_bestand + v_item.quantity 
    WHERE id = v_item.article_id;
    
    -- Log history
    INSERT INTO public.article_history (
      article_id, old_stock, new_stock, type, amount
    ) VALUES (
      v_item.article_id, v_current_bestand, v_current_bestand + v_item.quantity, 'input', v_item.quantity
    );
  END LOOP;

  -- Delete the bundle article itself (will cascade delete bundle_items, article_history, comments)
  DELETE FROM public.articles WHERE id = p_bundle_id;

  -- Log activity
  INSERT INTO public.activity_logs (
    type, message, payload
  ) VALUES (
    'delete', 
    'Artikel-Bundle "' || v_bundle_name || '" wurde aufgelöst und die Komponenten zurückgebucht', 
    jsonb_build_object('bundle_id', p_bundle_id, 'name', v_bundle_name)
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Realtime aktivieren für bundle_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.bundle_items;

-- Schema-Cache aktualisieren
NOTIFY pgrst, 'reload schema';
