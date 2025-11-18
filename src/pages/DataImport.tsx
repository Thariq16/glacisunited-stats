import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { importTeams, importMatch, importPlayerStats } from "@/utils/importData";
import europaPoint1st from '@/data/europa-point-1st.csv?raw';
import europaPoint2nd from '@/data/europa-point-2nd.csv?raw';
import glacisUnited1st from '@/data/glacis-united-1st.csv?raw';
import glacisUnited2nd from '@/data/glacis-united-2nd.csv?raw';
import { Database, Loader2 } from 'lucide-react';

export default function DataImport() {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Step 1: Import teams
      toast({ title: "Importing teams..." });
      await importTeams();

      // Step 2: Import match
      toast({ title: "Importing match data..." });
      const match = await importMatch(
        'glacis-united',
        'europa-point',
        '2025-11-10',
        3,
        1,
        'Glacis Stadium',
        'League'
      );

      // Step 3: Import player stats for both teams
      toast({ title: "Importing Glacis United player stats..." });
      await importPlayerStats('glacis-united', match.id, glacisUnited1st, glacisUnited2nd);

      toast({ title: "Importing Europa Point player stats..." });
      await importPlayerStats('europa-point', match.id, europaPoint1st, europaPoint2nd);

      toast({
        title: "Import complete!",
        description: "All data has been successfully imported to the database.",
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Import CSV Data</CardTitle>
              </div>
              <CardDescription>
                Import match and player statistics from CSV files into the database. 
                This is a one-time operation to populate the database with initial data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="font-semibold mb-2">What will be imported:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Teams: Glacis United and Europa Point FC</li>
                    <li>Match: Glacis United vs Europa Point FC (Nov 10, 2025)</li>
                    <li>Player statistics for both teams (1st and 2nd half)</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleImport} 
                  disabled={isImporting}
                  size="lg"
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Import Data
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Note: This will upsert data, so running it multiple times is safe
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
