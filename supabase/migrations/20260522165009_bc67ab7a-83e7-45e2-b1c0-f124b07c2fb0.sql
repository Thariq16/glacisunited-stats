-- STORIES + STORY VERSIONS ----------------------------------------------------

CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('match', 'player', 'pattern')),
  subject_id uuid NOT NULL,
  audience text NOT NULL CHECK (audience IN ('coach', 'player', 'analyst')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  current_version_id uuid,
  stats_hash text,
  share_caption text,
  created_by uuid NOT NULL,
  updated_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, subject_id, audience)
);

CREATE INDEX idx_stories_org ON public.stories (organization_id);
CREATE INDEX idx_stories_subject ON public.stories (kind, subject_id);

CREATE TABLE public.story_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  content jsonb NOT NULL,
  edited_by uuid NOT NULL,
  source text NOT NULL DEFAULT 'human' CHECK (source IN ('ai', 'human')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, version_number)
);

CREATE INDEX idx_story_versions_story ON public.story_versions (story_id, version_number DESC);

ALTER TABLE public.stories ADD CONSTRAINT stories_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.story_versions(id) ON DELETE SET NULL;

-- updated_at trigger
CREATE TRIGGER stories_set_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS -------------------------------------------------------------------------

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_versions ENABLE ROW LEVEL SECURITY;

-- Helper: is the user an editor (admin/coach/analyst) for this org?
CREATE OR REPLACE FUNCTION public.is_org_editor(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('owner', 'admin', 'analyst', 'coach')
  )
$$;

-- Stories policies
CREATE POLICY "Editors can read all stories in their org"
ON public.stories FOR SELECT TO authenticated
USING (public.is_org_editor(auth.uid(), organization_id));

CREATE POLICY "Members can read published stories in their org"
ON public.stories FOR SELECT TO authenticated
USING (status = 'published' AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Editors can insert stories in their org"
ON public.stories FOR INSERT TO authenticated
WITH CHECK (
  public.is_org_editor(auth.uid(), organization_id)
  AND auth.uid() = created_by
);

CREATE POLICY "Editors can update stories in their org"
ON public.stories FOR UPDATE TO authenticated
USING (public.is_org_editor(auth.uid(), organization_id))
WITH CHECK (public.is_org_editor(auth.uid(), organization_id));

CREATE POLICY "Editors can delete stories in their org"
ON public.stories FOR DELETE TO authenticated
USING (public.is_org_editor(auth.uid(), organization_id));

-- Story versions policies — gated through parent story membership
CREATE POLICY "Editors can read versions of their org's stories"
ON public.story_versions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_versions.story_id
      AND public.is_org_editor(auth.uid(), s.organization_id)
  )
);

CREATE POLICY "Members can read versions referenced by a published story"
ON public.story_versions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_versions.story_id
      AND s.status = 'published'
      AND s.current_version_id = story_versions.id
      AND public.is_org_member(auth.uid(), s.organization_id)
  )
);

CREATE POLICY "Editors can insert versions in their org"
ON public.story_versions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_versions.story_id
      AND public.is_org_editor(auth.uid(), s.organization_id)
  )
  AND auth.uid() = edited_by
);

-- Versions are append-only — no UPDATE / DELETE policies on purpose.