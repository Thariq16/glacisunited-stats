import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Palette, Image, Moon, Globe } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

function AdminSettingsContent() {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [logoUrl, setLogoUrl] = useState(currentOrg?.logo_url || "");
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setLogoUrl(currentOrg.logo_url || "");
      // Fetch extended org data with color fields
      supabase
        .from("organizations")
        .select("primary_color, accent_color")
        .eq("id", currentOrg.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPrimaryColor((data as any).primary_color || "");
            setAccentColor((data as any).accent_color || "");
          }
        });
    }
  }, [currentOrg]);

  const syncBrandingCache = (updates: {
    logo_url?: string | null;
    primary_color?: string | null;
    accent_color?: string | null;
  }) => {
    if (!currentOrg) return;

    if ("logo_url" in updates) {
      queryClient.setQueryData(
        ["organization", currentOrg.slug],
        (existing: typeof currentOrg | null | undefined) =>
          existing ? { ...existing, logo_url: updates.logo_url ?? null } : existing
      );
    }

    if ("primary_color" in updates || "accent_color" in updates) {
      queryClient.setQueryData(
        ["org-branding", currentOrg.id],
        (existing: { primary_color: string | null; accent_color: string | null } | null | undefined) => ({
          primary_color: "primary_color" in updates ? updates.primary_color ?? null : existing?.primary_color ?? null,
          accent_color: "accent_color" in updates ? updates.accent_color ?? null : existing?.accent_color ?? null,
        })
      );
    }

    void queryClient.invalidateQueries({ queryKey: ["organization", currentOrg.slug] });
    void queryClient.invalidateQueries({ queryKey: ["org-branding", currentOrg.id] });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrg) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${currentOrg.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("org-logos")
        .getPublicUrl(filePath);

      const newUrl = urlData.publicUrl;
      setLogoUrl(newUrl);

      await supabase
        .from("organizations")
        .update({ logo_url: newUrl })
        .eq("id", currentOrg.id);

      syncBrandingCache({ logo_url: newUrl });

      toast({ title: "Logo updated", description: "Your club logo has been uploaded." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveColors = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          primary_color: primaryColor || null,
          accent_color: accentColor || null,
        } as any)
        .eq("id", currentOrg.id);

      if (error) throw error;
      syncBrandingCache({
        primary_color: primaryColor || null,
        accent_color: accentColor || null,
      });
      toast({ title: "Colors saved", description: "Theme colors have been updated. Refresh to see changes." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Convert hex to HSL string for preview
  const hexToHsl = (hex: string): string | null => {
    if (!hex || !hex.startsWith("#") || hex.length < 7) return null;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Club Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Club Logo
              </CardTitle>
              <CardDescription>Upload your club's logo. It appears in the navbar and across the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Club logo" className="h-16 w-16 rounded-full object-cover border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl">⚽</div>
                )}
                <div>
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={uploading}>
                      <span>{uploading ? "Uploading..." : "Choose File"}</span>
                    </Button>
                  </Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Colors
              </CardTitle>
              <CardDescription>Set your club's brand colors. These will be applied across the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor || "#9b2d86"}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#9b2d86"
                      className="flex-1"
                    />
                  </div>
                  {primaryColor && (
                    <p className="text-xs text-muted-foreground">HSL: {hexToHsl(primaryColor)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={accentColor || "#40bfa3"}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#40bfa3"
                      className="flex-1"
                    />
                  </div>
                  {accentColor && (
                    <p className="text-xs text-muted-foreground">HSL: {hexToHsl(accentColor)}</p>
                  )}
                </div>
              </div>

              {/* Preview */}
              {(primaryColor || accentColor) && (
                <div className="flex gap-3 pt-2">
                  <div className="h-10 w-10 rounded-full border border-border" style={{ backgroundColor: primaryColor || undefined }} />
                  <div className="h-10 w-10 rounded-full border border-border" style={{ backgroundColor: accentColor || undefined }} />
                  <span className="text-sm text-muted-foreground self-center">Preview</span>
                </div>
              )}

              <Button onClick={handleSaveColors} disabled={saving}>
                {saving ? "Saving..." : "Save Colors"}
              </Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Toggle dark mode for the entire app.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language
              </CardTitle>
              <CardDescription>Choose your preferred language.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminSettings() {
  return (
    <ProtectedRoute requireCoach>
      <AdminSettingsContent />
    </ProtectedRoute>
  );
}
