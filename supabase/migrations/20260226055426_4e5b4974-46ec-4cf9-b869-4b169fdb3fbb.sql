
-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true);

-- Public read access for org logos
CREATE POLICY "Org logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');

-- Org owners can upload logos
CREATE POLICY "Authenticated users can upload org logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);

-- Org owners can update logos
CREATE POLICY "Authenticated users can update org logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);

-- Org owners can delete logos
CREATE POLICY "Authenticated users can delete org logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);
