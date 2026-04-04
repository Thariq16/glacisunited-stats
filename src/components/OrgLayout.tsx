import { useEffect } from 'react';
import { OrganizationProvider, useOrganization } from '@/contexts/OrganizationContext';
import { Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function hexToHsl(hex: string): string | null {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return null;
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
}

function OrgThemeApplier() {
  const { currentOrg } = useOrganization();

  const { data: brandingData } = useQuery({
    queryKey: ['org-branding', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const { data } = await supabase
        .from('organizations')
        .select('primary_color, accent_color')
        .eq('id', currentOrg.id)
        .single();
      return data as { primary_color: string | null; accent_color: string | null } | null;
    },
    enabled: !!currentOrg?.id,
  });

  useEffect(() => {
    const root = document.documentElement;
    const primaryHsl = brandingData?.primary_color ? hexToHsl(brandingData.primary_color) : null;
    const accentHsl = brandingData?.accent_color ? hexToHsl(brandingData.accent_color) : null;

    if (primaryHsl) {
      root.style.setProperty('--primary', primaryHsl);
      root.style.setProperty('--ring', primaryHsl);
      root.style.setProperty('--chart-1', primaryHsl);
      root.style.setProperty('--sidebar-ring', primaryHsl);
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--chart-1');
      root.style.removeProperty('--sidebar-ring');
    }

    if (accentHsl) {
      root.style.setProperty('--accent', accentHsl);
      root.style.setProperty('--chart-2', accentHsl);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--chart-2');
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--chart-1');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--chart-2');
    };
  }, [brandingData]);

  return null;
}

/**
 * Wraps all /org/:orgSlug/* routes with the OrganizationProvider
 */
export function OrgLayout() {
  return (
    <OrganizationProvider>
      <OrgThemeApplier />
      <Outlet />
    </OrganizationProvider>
  );
}
