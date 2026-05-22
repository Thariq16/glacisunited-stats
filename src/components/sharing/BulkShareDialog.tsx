import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Download, Loader2, ImageDown } from "lucide-react";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { captureShareable, downloadDataUrl, slugify } from "./exportShareable";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkShareDialogProps {
  /** Ref to the root element to scan for [data-shareable] children. */
  containerRef: React.RefObject<HTMLElement>;
  /** Subject — used in filenames and subtitle (e.g. "Glacis United vs Europa Point", or "Player — John Doe"). */
  subject: string;
  subtitle?: string;
  trigger?: React.ReactNode;
  /** File name prefix, e.g. "match-2024-08-10" or "player-john-doe" */
  fileNamePrefix: string;
  buttonLabel?: string;
}

interface DiscoveredItem {
  id: string;
  title: string;
  node: HTMLElement;
}

export function BulkShareDialog({
  containerRef,
  subject,
  subtitle,
  trigger,
  fileNamePrefix,
  buttonLabel = "Share",
}: BulkShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DiscoveredItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { currentOrg } = useOrganization();
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

  // Scan for shareable elements whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    const root = containerRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-shareable]"));
    const found: DiscoveredItem[] = nodes
      .map((node, i) => {
        const title = node.getAttribute("data-share-title") || `Visualization ${i + 1}`;
        const id = node.getAttribute("data-share-id") || `viz-${i}-${slugify(title)}`;
        return { id, title, node };
      });
    setItems(found);
    setSelected(new Set(found.map((f) => f.id)));
  }, [open, containerRef]);

  const orgName = currentOrg?.name || "FootyMetrics";
  const orgLogoUrl = currentOrg?.logo_url || null;
  const accent = orgExtras?.primary_color || "#3b82f6";

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const downloadOne = async (item: DiscoveredItem) => {
    setBusy(item.id);
    try {
      const url = await captureShareable(item.node, {
        title: item.title,
        subtitle: subtitle || subject,
        orgName,
        orgLogoUrl,
        accent,
      });
      downloadDataUrl(url, `${fileNamePrefix}-${slugify(item.title)}.png`);
    } catch (err) {
      console.error(err);
      toast.error(`Could not export "${item.title}"`);
    } finally {
      setBusy(null);
    }
  };

  const downloadAll = async () => {
    const queue = items.filter((i) => selected.has(i.id));
    if (queue.length === 0) {
      toast.info("Select at least one visualization");
      return;
    }
    setBulkBusy(true);
    try {
      for (const item of queue) {
        setBusy(item.id);
        try {
          const url = await captureShareable(item.node, {
            title: item.title,
            subtitle: subtitle || subject,
            orgName,
            orgLogoUrl,
            accent,
          });
          downloadDataUrl(url, `${fileNamePrefix}-${slugify(item.title)}.png`);
          // Small delay so browsers don't drop downloads
          await new Promise((r) => setTimeout(r, 350));
        } catch (err) {
          console.error(err);
          toast.error(`Skipped "${item.title}" — could not export`);
        }
      }
      toast.success(`Downloaded ${queue.length} image${queue.length === 1 ? "" : "s"}`);
    } finally {
      setBulkBusy(false);
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" /> {buttonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Share visualizations</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground -mt-2">
          Each image is exported with{" "}
          <span className="font-medium text-foreground">© FootyMetrics</span> and{" "}
          <span className="font-medium text-foreground">Analyst — Thariq Hamad</span> watermarks.
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No shareable visualizations found on the current view. Switch to a tab that shows charts and try again.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b pb-2">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                {selected.size === items.length ? "Deselect all" : "Select all"}
              </button>
              <span className="text-xs text-muted-foreground">
                {selected.size} of {items.length} selected
              </span>
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
              <ul className="divide-y">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <Checkbox
                      id={`share-${item.id}`}
                      checked={selected.has(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                    />
                    <label
                      htmlFor={`share-${item.id}`}
                      className="flex-1 text-sm cursor-pointer leading-tight"
                    >
                      {item.title}
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadOne(item)}
                      disabled={!!busy}
                      title="Download just this one"
                    >
                      {busy === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageDown className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            <div className="pt-3 border-t flex gap-2">
              <Button onClick={downloadAll} disabled={bulkBusy || selected.size === 0} className="flex-1">
                {bulkBusy ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download {selected.size > 0 ? `${selected.size} ` : ""}image
                {selected.size === 1 ? "" : "s"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
