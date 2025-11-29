import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMatches } from "@/hooks/usePlayerStats";
import { useMatchComments, useDeleteMatchComment } from "@/hooks/useMatchComments";
import { MessageSquare, Loader2, Trash2, ArrowLeft, Upload, FileText, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

interface ParsedComment {
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  comment: string;
  matchId?: string;
  status: 'pending' | 'matched' | 'not_found';
}

function AdminCommentsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  
  // CSV upload state
  const [parsedComments, setParsedComments] = useState<ParsedComment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string>("");
  
  const { data: comments, isLoading: commentsLoading } = useMatchComments(selectedMatchId || undefined);
  const deleteComment = useDeleteMatchComment();

  const handleAddComment = async () => {
    if (!selectedMatchId) {
      toast.error("Please select a match");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('match_comments')
        .insert({
          match_id: selectedMatchId,
          comment: newComment.trim(),
          created_by: user.id,
        });
      
      if (error) throw error;
      
      toast.success("Coach note added");
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['match-comments', selectedMatchId] });
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ id: commentId, matchId: selectedMatchId });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const parseCSV = (text: string): ParsedComment[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    return dataLines.map(line => {
      // Handle CSV with quoted fields
      const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const values = matches.map(v => v.replace(/^"|"$/g, '').trim());
      
      const [matchDate, homeTeam, awayTeam, comment] = values;
      
      return {
        matchDate: matchDate || '',
        homeTeam: homeTeam || '',
        awayTeam: awayTeam || '',
        comment: comment || '',
        status: 'pending' as const,
      };
    }).filter(row => row.matchDate && row.comment);
  };

  const matchCommentsToMatches = (parsed: ParsedComment[]): ParsedComment[] => {
    if (!matches) return parsed;
    
    return parsed.map(pc => {
      // Try to find matching match by date and team names
      const matchFound = matches.find(m => {
        const matchDateStr = new Date(m.match_date).toISOString().split('T')[0];
        const inputDateStr = new Date(pc.matchDate).toISOString().split('T')[0];
        
        const homeMatches = m.home_team?.name?.toLowerCase().includes(pc.homeTeam.toLowerCase()) ||
                          pc.homeTeam.toLowerCase().includes(m.home_team?.name?.toLowerCase() || '');
        const awayMatches = m.away_team?.name?.toLowerCase().includes(pc.awayTeam.toLowerCase()) ||
                          pc.awayTeam.toLowerCase().includes(m.away_team?.name?.toLowerCase() || '');
        
        return matchDateStr === inputDateStr && homeMatches && awayMatches;
      });
      
      if (matchFound) {
        return { ...pc, matchId: matchFound.id, status: 'matched' as const };
      }
      return { ...pc, status: 'not_found' as const };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }
    
    setCsvFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      const matched = matchCommentsToMatches(parsed);
      setParsedComments(matched);
      
      const matchedCount = matched.filter(c => c.status === 'matched').length;
      toast.info(`Parsed ${matched.length} comments, ${matchedCount} matched to existing matches`);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    const matchedComments = parsedComments.filter(c => c.status === 'matched' && c.matchId);
    
    if (matchedComments.length === 0) {
      toast.error("No matched comments to upload");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const inserts = matchedComments.map(c => ({
        match_id: c.matchId!,
        comment: c.comment,
        created_by: user.id,
      }));
      
      const { error } = await supabase
        .from('match_comments')
        .insert(inserts);
      
      if (error) throw error;
      
      toast.success(`Uploaded ${matchedComments.length} coach notes`);
      setParsedComments([]);
      setCsvFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ['match-comments'] });
      queryClient.invalidateQueries({ queryKey: ['all-match-comments'] });
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error("Failed to upload comments");
    } finally {
      setIsUploading(false);
    }
  };

  const clearParsedComments = () => {
    setParsedComments([]);
    setCsvFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedMatch = matches?.find(m => m.id === selectedMatchId);
  const matchedCount = parsedComments.filter(c => c.status === 'matched').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Manage Coach Notes</h1>
          </div>
          <p className="text-muted-foreground">Add notes and comments for matches that coaches can view</p>
        </div>

        <Tabs defaultValue="single" className="max-w-6xl">
          <TabsList className="mb-6">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Single Note
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Add New Comment */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Note</CardTitle>
                  <CardDescription>Select a match and add coach notes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Match</Label>
                    <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a match..." />
                      </SelectTrigger>
                      <SelectContent>
                        {matchesLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          matches?.map((match) => (
                            <SelectItem key={match.id} value={match.id}>
                              {match.home_team?.name} vs {match.away_team?.name} - {new Date(match.match_date).toLocaleDateString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Enter coach notes for this match..."
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handleAddComment} 
                    disabled={!selectedMatchId}
                    className="w-full"
                  >
                    Add Note
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Comments for Selected Match */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Notes</CardTitle>
                  <CardDescription>
                    {selectedMatch 
                      ? `Notes for ${selectedMatch.home_team?.name} vs ${selectedMatch.away_team?.name}`
                      : "Select a match to view notes"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedMatchId ? (
                    <p className="text-muted-foreground text-sm">Select a match to view and manage notes</p>
                  ) : commentsLoading ? (
                    <div className="space-y-2">
                      <div className="h-16 bg-muted animate-pulse rounded" />
                      <div className="h-16 bg-muted animate-pulse rounded" />
                    </div>
                  ) : comments && comments.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/50 rounded-lg p-3 relative group">
                          <p className="text-foreground text-sm whitespace-pre-wrap pr-8">{comment.comment}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete note?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No notes for this match yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bulk">
            <div className="space-y-6">
              {/* CSV Upload Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Upload CSV File
                  </CardTitle>
                  <CardDescription>
                    Upload a CSV file with columns: match_date, home_team, away_team, comment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-1">
                        {csvFileName || "Click to select CSV file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Format: match_date, home_team, away_team, comment
                      </p>
                    </label>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">CSV Format Example:</p>
                    <code className="text-xs block bg-background p-2 rounded">
                      match_date,home_team,away_team,comment<br/>
                      2025-11-10,Glacis United,Europa Point,"Great defensive performance"<br/>
                      2025-11-10,Glacis United,Europa Point,"Need to work on set pieces"
                    </code>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Table */}
              {parsedComments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Preview ({parsedComments.length} comments)</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {matchedCount} matched
                        </Badge>
                        <Badge variant="outline">
                          {parsedComments.length - matchedCount} not found
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Review matched comments before uploading. Only matched comments will be uploaded.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Home Team</TableHead>
                            <TableHead>Away Team</TableHead>
                            <TableHead>Comment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedComments.map((pc, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                {pc.status === 'matched' ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{pc.matchDate}</TableCell>
                              <TableCell className="text-sm">{pc.homeTeam}</TableCell>
                              <TableCell className="text-sm">{pc.awayTeam}</TableCell>
                              <TableCell className="text-sm max-w-xs truncate">{pc.comment}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Button 
                        onClick={handleBulkUpload}
                        disabled={isUploading || matchedCount === 0}
                        className="flex-1"
                      >
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload {matchedCount} Notes
                      </Button>
                      <Button variant="outline" onClick={clearParsedComments}>
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminComments() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminCommentsContent />
    </ProtectedRoute>
  );
}
