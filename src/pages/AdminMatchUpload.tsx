import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function AdminMatchUploadContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    homeTeamName: "",
    awayTeamName: "",
    matchDate: "",
    homeScore: "",
    awayScore: "",
    venue: "",
    competition: "",
  });

  const [files, setFiles] = useState({
    homeTeam1stCSV: null as File | null,
    homeTeam2ndCSV: null as File | null,
    awayTeam1stCSV: null as File | null,
    awayTeam2ndCSV: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFiles({ ...files, [fieldName]: file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.homeTeamName || !formData.awayTeamName || !formData.matchDate) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required match details.",
      });
      return;
    }

    if (!files.homeTeam1stCSV || !files.homeTeam2ndCSV || !files.awayTeam1stCSV || !files.awayTeam2ndCSV) {
      toast({
        variant: "destructive",
        title: "Missing Files",
        description: "Please upload all 4 CSV files (1st and 2nd half for both teams).",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Prepare form data
      const uploadFormData = new FormData();
      uploadFormData.append('homeTeamName', formData.homeTeamName);
      uploadFormData.append('awayTeamName', formData.awayTeamName);
      uploadFormData.append('matchDate', formData.matchDate);
      uploadFormData.append('homeScore', formData.homeScore || '0');
      uploadFormData.append('awayScore', formData.awayScore || '0');
      uploadFormData.append('venue', formData.venue || '');
      uploadFormData.append('competition', formData.competition || 'League');
      uploadFormData.append('homeTeam1stCSV', files.homeTeam1stCSV);
      uploadFormData.append('homeTeam2ndCSV', files.homeTeam2ndCSV);
      uploadFormData.append('awayTeam1stCSV', files.awayTeam1stCSV);
      uploadFormData.append('awayTeam2ndCSV', files.awayTeam2ndCSV);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('import-match-data', {
        body: uploadFormData,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Match data has been imported successfully.",
      });

      // Reset form
      setFormData({
        homeTeamName: "",
        awayTeamName: "",
        matchDate: "",
        homeScore: "",
        awayScore: "",
        venue: "",
        competition: "",
      });
      setFiles({
        homeTeam1stCSV: null,
        homeTeam2ndCSV: null,
        awayTeam1stCSV: null,
        awayTeam2ndCSV: null,
      });

      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        input.value = '';
      });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to import match data. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Upload Match Data
            </CardTitle>
            <CardDescription>
              Upload CSV files for a new match. Teams and players will be created automatically if they don't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Match Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Match Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="homeTeamName">Home Team Name *</Label>
                    <Input
                      id="homeTeamName"
                      name="homeTeamName"
                      value={formData.homeTeamName}
                      onChange={handleInputChange}
                      placeholder="e.g., Glacis United"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="awayTeamName">Away Team Name *</Label>
                    <Input
                      id="awayTeamName"
                      name="awayTeamName"
                      value={formData.awayTeamName}
                      onChange={handleInputChange}
                      placeholder="e.g., Europa Point FC"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="matchDate">Match Date *</Label>
                    <Input
                      id="matchDate"
                      name="matchDate"
                      type="date"
                      value={formData.matchDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                      placeholder="e.g., Victoria Stadium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homeScore">Home Score</Label>
                    <Input
                      id="homeScore"
                      name="homeScore"
                      type="number"
                      min="0"
                      value={formData.homeScore}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="awayScore">Away Score</Label>
                    <Input
                      id="awayScore"
                      name="awayScore"
                      type="number"
                      min="0"
                      value={formData.awayScore}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competition">Competition</Label>
                    <Input
                      id="competition"
                      name="competition"
                      value={formData.competition}
                      onChange={handleInputChange}
                      placeholder="e.g., League, Cup"
                    />
                  </div>
                </div>
              </div>

              {/* CSV File Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">CSV Files *</h3>
                <p className="text-sm text-muted-foreground">
                  Upload player statistics CSV files for both halves of the match
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="homeTeam1stCSV">Home Team - 1st Half</Label>
                    <Input
                      id="homeTeam1stCSV"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(e, 'homeTeam1stCSV')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homeTeam2ndCSV">Home Team - 2nd Half</Label>
                    <Input
                      id="homeTeam2ndCSV"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(e, 'homeTeam2ndCSV')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="awayTeam1stCSV">Away Team - 1st Half</Label>
                    <Input
                      id="awayTeam1stCSV"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(e, 'awayTeam1stCSV')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="awayTeam2ndCSV">Away Team - 2nd Half</Label>
                    <Input
                      id="awayTeam2ndCSV"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(e, 'awayTeam2ndCSV')}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isUploading} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Match Data
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}

export default function AdminMatchUpload() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminMatchUploadContent />
    </ProtectedRoute>
  );
}
