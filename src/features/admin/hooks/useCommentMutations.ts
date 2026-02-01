/**
 * Admin Comments Mutations Hook
 * Extracts data mutation logic from AdminComments for better code organization
 */
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type NoteType = '1st_half' | '2nd_half' | 'overall';

interface ParsedComment {
    minute?: string;
    comment: string;
    noteType: NoteType;
}

/**
 * CSV parsing utility
 */
export function parseCSV(text: string, type: NoteType): ParsedComment[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Skip header row and filter empty lines
    const dataLines = lines.slice(1).filter(line => line.trim() && !line.match(/^,+$/));

    return dataLines.map(line => {
        // Handle CSV with quoted fields
        const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
        const values = matches.map(v => v.replace(/^"|"$/g, '').replace(/^\uFEFF/, '').trim());

        if (type === 'overall') {
            // Overall format: just "Note & Comment"
            const comment = values[0] || '';
            return {
                comment,
                noteType: type,
            };
        } else {
            // 1st/2nd half format: "Min,Note & Comment"
            const [minute, comment] = values;
            return {
                minute: minute || '',
                comment: comment || '',
                noteType: type,
            };
        }
    }).filter(row => row.comment.trim());
}

/**
 * Format comment with minute prefix
 */
export function formatCommentWithMinute(pc: ParsedComment): string {
    const prefix = pc.noteType === '1st_half' ? '[1st Half' :
        pc.noteType === '2nd_half' ? '[2nd Half' : '[Overall';

    if (pc.minute) {
        return `${prefix} - ${pc.minute}] ${pc.comment}`;
    }
    return `${prefix}] ${pc.comment}`;
}

export function useCommentMutations() {
    const queryClient = useQueryClient();

    /**
     * Add a single comment
     */
    const addComment = async (matchId: string, comment: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('match_comments')
            .insert({
                match_id: matchId,
                comment: comment.trim(),
                created_by: user.id,
            });

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['match-comments', matchId] });
        return true;
    };

    /**
     * Bulk upload comments
     */
    const bulkUploadComments = async (matchId: string, parsedComments: ParsedComment[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const inserts = parsedComments.map(pc => ({
            match_id: matchId,
            comment: formatCommentWithMinute(pc),
            created_by: user.id,
        }));

        const { error } = await supabase
            .from('match_comments')
            .insert(inserts);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['match-comments'] });
        queryClient.invalidateQueries({ queryKey: ['all-match-comments'] });
        return true;
    };

    return {
        addComment,
        bulkUploadComments,
        parseCSV,
        formatCommentWithMinute,
    };
}

export type { NoteType, ParsedComment };
