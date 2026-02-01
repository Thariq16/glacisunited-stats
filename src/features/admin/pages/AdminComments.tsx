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
import { MessageSquare, Loader2, Trash2, ArrowLeft, Upload, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
import { useCommentMutations, parseCSV, type NoteType, type ParsedComment } from "../hooks";

function AdminCommentsContent() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [newComment, setNewComment] = useState("");

  // CSV upload state
  const [parsedComments, setParsedComments] = useState<ParsedComment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [uploadMatchId, setUploadMatchId] = useState<string>("");
  const [noteType, setNoteType] = useState<NoteType>('1st_half');

  const { data: comments, isLoading: commentsLoading } = useMatchComments(selectedMatchId || undefined);
  const deleteComment = useDeleteMatchComment();
  const { addComment, bulkUploadComments } = useCommentMutations();

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
      await addComment(selectedMatchId, newComment);
      toast.success("Coach note added");
      setNewComment("");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ id: commentId, matchId: selectedMatchId });
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    setCsvFileName(file.name);

    // Auto-detect note type from filename
    const fileName = file.name.toLowerCase();
    if (fileName.includes('1st') || fileName.includes('first')) {
      setNoteType('1st_half');
    } else if (fileName.includes('2nd') || fileName.includes('second')) {
      setNoteType('2nd_half');
    } else if (fileName.includes('overall') || fileName.includes('match')) {
      setNoteType('overall');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text, noteType);
      setParsedComments(parsed);
      toast.info(`Parsed ${parsed.length} notes`);
    };
    reader.readAsText(file);
  };

  // Re-parse when note type changes
  const handleNoteTypeChange = (type: NoteType) => {
    setNoteType(type);
    if (fileInputRef.current?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text, type);
        setParsedComments(parsed);
      };
      reader.readAsText(fileInputRef.current.files[0]);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadMatchId) {
      toast.error("Please select a match");
      return;
    }

    if (parsedComments.length === 0) {
      toast.error("No notes to upload");
      return;
    }

    setIsUploading(true);

    try {
      await bulkUploadComments(uploadMatchId, parsedComments);
      toast.success(`Uploaded ${parsedComments.length} coach notes`);
      setParsedComments([]);
      setCsvFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to upload notes");
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
  const uploadMatch = matches?.find(m => m.id === uploadMatchId);

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
            <h1 className="text-4xl font-bold text-foreground">Manage Analyst Notes</h1>
          </div>
          <p className="text-muted-foreground">Add notes and comments for matches that coaches can view</p>
        </div>

        <Tabs defaultValue="bulk" className="max-w-6xl">
          <TabsList className="mb-6">
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="single" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Single Note
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bulk">
            <div className="space-y-6">
              {/* Match Selection & CSV Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Upload CSV File
                  </CardTitle>
                  <CardDescription>
                    Select a match, choose the note type, and upload your CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select Match</Label>
                      <Select value={uploadMatchId} onValueChange={setUploadMatchId}>
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
                      <Label>Note Type</Label>
                      <Select value={noteType} onValueChange={(v) => handleNoteTypeChange(v as NoteType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st_half">1st Half Notes</SelectItem>
                          <SelectItem value="2nd_half">2nd Half Notes</SelectItem>
                          <SelectItem value="overall">Overall Match Notes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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
                        {noteType === 'overall'
                          ? 'Format: Note & Comment'
                          : 'Format: Min, Note & Comment'}
                      </p>
                    </label>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">CSV Format Examples:</p>
                    <div className="space-y-2">
                      <div>
                        <Badge variant="outline" className="mb-1">1st/2nd Half</Badge>
                        <code className="text-xs block bg-background p-2 rounded">
                          Min,Note & Comment<br />
                          13:15,GLA FC - #14 Charles - Weak in holding play<br />
                          21:20,GLA FC - #14 Charles - Body position while receiving...
                        </code>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-1">Overall</Badge>
                        <code className="text-xs block bg-background p-2 rounded">
                          Note & Comment<br />
                          Players are forcing themselves to find passes...<br />
                          #15 was standout player in the match...
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Table */}
              {parsedComments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Preview ({parsedComments.length} notes)</span>
                      <Badge>
                        {noteType === '1st_half' ? '1st Half' : noteType === '2nd_half' ? '2nd Half' : 'Overall'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {uploadMatch
                        ? `Notes for ${uploadMatch.home_team?.name} vs ${uploadMatch.away_team?.name}`
                        : 'Select a match to upload notes'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            {noteType !== 'overall' && <TableHead className="w-24">Minute</TableHead>}
                            <TableHead>Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedComments.map((pc, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                              {noteType !== 'overall' && (
                                <TableCell className="text-sm font-mono">{pc.minute || '-'}</TableCell>
                              )}
                              <TableCell className="text-sm">{pc.comment}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={handleBulkUpload}
                        disabled={isUploading || !uploadMatchId || parsedComments.length === 0}
                        className="flex-1"
                      >
                        {isUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Upload {parsedComments.length} Notes
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
