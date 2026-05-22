import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { StoryAudience, StoryContent, StoryRow, StoryVersionRow } from './types';

export function useMatchStory(matchId: string | undefined, audience: StoryAudience) {
  const { currentOrg, primaryTeam } = useOrganization();
  const orgId = currentOrg?.id;
  const primaryTeamId = primaryTeam?.id;
  const qc = useQueryClient();

  const storyQuery = useQuery({
    queryKey: ['story', 'match', matchId, audience, orgId],
    enabled: !!matchId && !!orgId,
    queryFn: async () => {
      const { data: story } = await supabase
        .from('stories')
        .select('*')
        .eq('kind', 'match')
        .eq('subject_id', matchId!)
        .eq('audience', audience)
        .eq('organization_id', orgId!)
        .maybeSingle();
      if (!story) return { story: null, versions: [] as StoryVersionRow[] };
      const { data: versions } = await supabase
        .from('story_versions')
        .select('*')
        .eq('story_id', story.id)
        .order('version_number', { ascending: false });
      return {
        story: story as StoryRow,
        versions: (versions ?? []) as unknown as StoryVersionRow[],
      };
    },
  });

  const draft = useMutation({
    mutationFn: async () => {
      if (!matchId) throw new Error('No match');
      const { data, error } = await supabase.functions.invoke('draft-story', {
        body: { matchId, audience },
      });
      if (error) throw error;
      return data as { content: StoryContent };
    },
    onError: (e: any) => toast.error(e?.message || 'Could not generate draft'),
  });

  const saveVersion = useMutation({
    mutationFn: async (input: { content: StoryContent; source?: 'ai' | 'human'; note?: string }) => {
      if (!matchId || !orgId) throw new Error('Missing context');
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) throw new Error('Sign in required');

      // Upsert the parent story
      let storyId = storyQuery.data?.story?.id;
      if (!storyId) {
        const { data: created, error: ce } = await supabase
          .from('stories')
          .insert({
            organization_id: orgId,
            kind: 'match',
            subject_id: matchId,
            audience,
            status: 'draft',
            created_by: uid,
            updated_by: uid,
          })
          .select('id')
          .single();
        if (ce) throw ce;
        storyId = created.id;
      }

      const nextVersion = (storyQuery.data?.versions[0]?.version_number ?? 0) + 1;
      const { data: version, error: ve } = await supabase
        .from('story_versions')
        .insert({
          story_id: storyId,
          version_number: nextVersion,
          content: input.content as any,
          edited_by: uid,
          source: input.source ?? 'human',
          note: input.note ?? null,
        })
        .select('*')
        .single();
      if (ve) throw ve;

      const { error: ue } = await supabase
        .from('stories')
        .update({ current_version_id: version.id, updated_by: uid })
        .eq('id', storyId);
      if (ue) throw ue;

      return version as unknown as StoryVersionRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story', 'match', matchId, audience, orgId] });
      toast.success('Version saved');
    },
    onError: (e: any) => toast.error(e?.message || 'Save failed'),
  });

  const setStatus = useMutation({
    mutationFn: async (status: 'draft' | 'published') => {
      const storyId = storyQuery.data?.story?.id;
      if (!storyId) throw new Error('Save a draft first');
      const { error } = await supabase
        .from('stories')
        .update({
          status,
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story', 'match', matchId, audience, orgId] });
    },
    onError: (e: any) => toast.error(e?.message || 'Status update failed'),
  });

  const restoreVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const storyId = storyQuery.data?.story?.id;
      if (!storyId) throw new Error('No story');
      const { error } = await supabase
        .from('stories')
        .update({ current_version_id: versionId })
        .eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story', 'match', matchId, audience, orgId] });
      toast.success('Restored');
    },
  });

  const currentVersion = storyQuery.data?.versions.find(
    (v) => v.id === storyQuery.data?.story?.current_version_id
  ) ?? storyQuery.data?.versions[0] ?? null;

  return {
    story: storyQuery.data?.story ?? null,
    versions: storyQuery.data?.versions ?? [],
    currentVersion,
    isLoading: storyQuery.isLoading,
    draft,
    saveVersion,
    setStatus,
    restoreVersion,
  };
}
