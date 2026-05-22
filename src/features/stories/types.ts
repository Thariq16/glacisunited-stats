export interface StoryChapter {
  id: string;
  title: string;
  body: string;
  fixIt?: string;
}

export interface StoryContent {
  headline: string;
  summary: string;
  chapters: StoryChapter[];
}

export type StoryAudience = 'coach' | 'player' | 'analyst';
export type StoryStatus = 'draft' | 'published';
export type StoryKind = 'match' | 'player' | 'pattern';

export interface StoryRow {
  id: string;
  organization_id: string;
  kind: StoryKind;
  subject_id: string;
  audience: StoryAudience;
  status: StoryStatus;
  current_version_id: string | null;
  share_caption: string | null;
  created_by: string;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryVersionRow {
  id: string;
  story_id: string;
  version_number: number;
  content: StoryContent;
  edited_by: string;
  source: 'ai' | 'human';
  note: string | null;
  created_at: string;
}
