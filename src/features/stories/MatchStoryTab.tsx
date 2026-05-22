import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Save, Send, Plus, Trash2, History, FileText } from 'lucide-react';
import { useMatchStory } from './useMatchStory';
import { StoryAudience, StoryContent } from './types';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  matchId: string;
  matchTitle: string;
  matchSubtitle?: string;
}

const emptyStory: StoryContent = {
  headline: '',
  summary: '',
  chapters: [{ id: 'c1', title: '', body: '' }],
};

export function MatchStoryTab({ matchId, matchTitle, matchSubtitle }: Props) {
  const [audience, setAudience] = useState<StoryAudience>('coach');
  const {
    story,
    versions,
    currentVersion,
    isLoading,
    draft,
    saveVersion,
    setStatus,
    restoreVersion,
  } = useMatchStory(matchId, audience);

  const [editing, setEditing] = useState<StoryContent>(emptyStory);
  const [dirty, setDirty] = useState(false);

  // Hydrate editor whenever the loaded version changes
  useEffect(() => {
    if (currentVersion) {
      setEditing(currentVersion.content);
      setDirty(false);
    } else {
      setEditing(emptyStory);
      setDirty(false);
    }
  }, [currentVersion?.id]);

  const update = (patch: Partial<StoryContent>) => {
    setEditing((s) => ({ ...s, ...patch }));
    setDirty(true);
  };

  const updateChapter = (i: number, patch: Partial<StoryContent['chapters'][number]>) => {
    setEditing((s) => ({
      ...s,
      chapters: s.chapters.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    }));
    setDirty(true);
  };

  const addChapter = () => {
    setEditing((s) => ({
      ...s,
      chapters: [...s.chapters, { id: `c${s.chapters.length + 1}`, title: '', body: '' }],
    }));
    setDirty(true);
  };

  const removeChapter = (i: number) => {
    setEditing((s) => ({ ...s, chapters: s.chapters.filter((_, idx) => idx !== i) }));
    setDirty(true);
  };

  const handleDraft = async () => {
    const res = await draft.mutateAsync();
    setEditing(res.content);
    setDirty(true);
  };

  const handleSave = (source: 'ai' | 'human' = 'human') =>
    saveVersion.mutate({ content: editing, source });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading story…
      </div>
    );
  }

  const isPublished = story?.status === 'published';

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={audience} onValueChange={(v) => setAudience(v as StoryAudience)}>
            <TabsList>
              <TabsTrigger value="coach">For Coach</TabsTrigger>
              <TabsTrigger value="player">For Players</TabsTrigger>
              <TabsTrigger value="analyst">Analyst Notes</TabsTrigger>
            </TabsList>
          </Tabs>
          {story && (
            <Badge variant={isPublished ? 'default' : 'secondary'}>
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          )}
          {versions.length > 0 && (
            <Select
              value={currentVersion?.id ?? ''}
              onValueChange={(id) => restoreVersion.mutate(id)}
            >
              <SelectTrigger className="w-[220px] h-9">
                <History className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    v{v.version_number} · {v.source} · {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleDraft} disabled={draft.isPending}>
            {draft.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {currentVersion ? 'Regenerate with AI' : 'Generate draft'}
          </Button>
          <Button size="sm" onClick={() => handleSave('human')} disabled={!dirty || saveVersion.isPending}>
            <Save className="h-4 w-4 mr-1" /> Save version
          </Button>
          {story && (
            <Button
              size="sm"
              variant={isPublished ? 'secondary' : 'default'}
              onClick={() => setStatus.mutate(isPublished ? 'draft' : 'published')}
              disabled={setStatus.isPending || !currentVersion}
            >
              <Send className="h-4 w-4 mr-1" />
              {isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          )}
          {currentVersion && (
            <ShareDialog
              title={editing.headline || matchTitle}
              subtitle={matchSubtitle}
              defaultCaption={editing.summary || 'Read the full match story.'}
              fileNameBase={`story-${matchId}-${audience}`}
            >
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {editing.chapters.slice(0, 3).map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
                    <div style={{ fontSize: 20, color: '#cbd5e1', lineHeight: 1.4 }}>
                      {c.body.length > 220 ? c.body.slice(0, 217) + '…' : c.body}
                    </div>
                  </div>
                ))}
              </div>
            </ShareDialog>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!currentVersion && !dirty && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-4">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No story yet for this audience</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generate an AI draft from the match data, then edit it before publishing.
              </p>
            </div>
            <Button onClick={handleDraft} disabled={draft.isPending}>
              {draft.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate AI draft
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      {(currentVersion || dirty) && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Headline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="headline" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Headline
                </Label>
                <Input
                  id="headline"
                  value={editing.headline}
                  onChange={(e) => update({ headline: e.target.value })}
                  placeholder="The one-line story…"
                  className="mt-1 text-lg font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="summary" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Summary
                </Label>
                <Textarea
                  id="summary"
                  value={editing.summary}
                  onChange={(e) => update({ summary: e.target.value })}
                  rows={2}
                  placeholder="A sentence or two — the key takeaway."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {editing.chapters.map((c, i) => (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Chapter {i + 1}</CardTitle>
                {editing.chapters.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChapter(i)}
                    aria-label="Remove chapter"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={c.title}
                  onChange={(e) => updateChapter(i, { title: e.target.value })}
                  placeholder="Chapter title"
                  className="font-medium"
                />
                <Textarea
                  value={c.body}
                  onChange={(e) => updateChapter(i, { body: e.target.value })}
                  rows={4}
                  placeholder="What happened, and why…"
                />
                {audience === 'coach' && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      How to fix it
                    </Label>
                    <Textarea
                      value={c.fixIt ?? ''}
                      onChange={(e) => updateChapter(i, { fixIt: e.target.value })}
                      rows={2}
                      placeholder="One concrete coaching action."
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addChapter} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Add chapter
          </Button>
        </div>
      )}
    </div>
  );
}
