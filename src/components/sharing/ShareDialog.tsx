import { ReactNode, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Download, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ShareableCard, ShareFormat, SHARE_FORMATS } from "./ShareableCard";

interface ShareDialogProps {
  title: string;
  subtitle?: string;
  defaultCaption: string;
  fileNameBase: string;
  trigger?: ReactNode;
  /** Children = the visualization to embed (already styled, will be centered) */
  children: ReactNode;
}

export function ShareDialog({
  title,
  subtitle,
  defaultCaption,
  fileNameBase,
  trigger,
  children,
}: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ShareFormat>("square");
  const [caption, setCaption] = useState(defaultCaption);
  const [showBranding, setShowBranding] = useState(true);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { currentOrg } = useOrganization();

  // Pull primary_color too (OrganizationContext doesn't expose it today)
  const { data: orgExtras } = useQuery({
    queryKey: ["org-branding", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const { data } = await supabase
        .from("organizations")
        .select("primary_color, accent_color")
        .eq("id", currentOrg.id)
        .maybeSingle();
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const render = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: SHARE_FORMATS[format].w,
        height: SHARE_FORMATS[format].h,
      });
      return dataUrl;
    } catch (err) {
      console.error("Card render failed", err);
      toast.error("Could not render the card");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const url = await render();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileNameBase}-${format}.png`;
    a.click();
    toast.success("Image downloaded");
  };

  const copy = async () => {
    const url = await render();
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard not available — try Download instead");
    }
  };

  const share = async () => {
    const url = await render();
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `${fileNameBase}-${format}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption, title });
        return;
      }
      // Fallback: text-only share
      if (navigator.share) {
        await navigator.share({ text: caption, title });
        return;
      }
      toast.info("Sharing not supported on this device — use Download");
    } catch (err: any) {
      if (err?.name !== "AbortError") toast.error("Sharing failed");
    }
  };

  const fmt = SHARE_FORMATS[format];
  // Scale the preview to fit a max width of 520px
  const previewMax = 520;
  const scale = Math.min(previewMax / fmt.w, (previewMax * 1.4) / fmt.h);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share insight</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr,260px]">
          {/* Preview */}
          <div className="flex justify-center bg-muted/40 rounded-md p-4 overflow-hidden min-h-[400px]">
            <div
              style={{
                width: fmt.w * scale,
                height: fmt.h * scale,
                position: "relative",
              }}
            >
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              >
                <ShareableCard
                  ref={cardRef}
                  format={format}
                  orgName={currentOrg?.name || "FootyMetrics"}
                  orgLogoUrl={currentOrg?.logo_url || null}
                  primaryColor={orgExtras?.primary_color || null}
                  title={title}
                  subtitle={subtitle}
                  caption={caption}
                  showBranding={showBranding}
                >
                  {children}
                </ShareableCard>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
                Format
              </Label>
              <Tabs value={format} onValueChange={(v) => setFormat(v as ShareFormat)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="story">Story</TabsTrigger>
                  <TabsTrigger value="landscape">Wide</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground mt-1">
                {fmt.w}×{fmt.h} — {fmt.hint}
              </p>
            </div>

            <div>
              <Label htmlFor="share-caption" className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
                Caption
              </Label>
              <Textarea
                id="share-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="One-line takeaway…"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="share-branding" className="text-sm">
                Show club branding
              </Label>
              <Switch
                id="share-branding"
                checked={showBranding}
                onCheckedChange={setShowBranding}
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Button onClick={download} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Download PNG
              </Button>
              <Button onClick={copy} disabled={busy} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              <Button onClick={share} disabled={busy} variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" /> Share…
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
