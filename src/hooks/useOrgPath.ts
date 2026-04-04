import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Returns a function to build org-scoped paths.
 * Usage: const orgPath = useOrgPath(); orgPath('/matches') => '/org/glacis-united-fc/matches'
 */
export function useOrgPath() {
  const { orgSlug } = useOrganization();

  return (path: string) => {
    if (!orgSlug) return path;
    // Strip leading slash from path for clean join
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/org/${orgSlug}${cleanPath ? `/${cleanPath}` : ''}`;
  };
}
