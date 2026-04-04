import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { Outlet } from 'react-router-dom';

/**
 * Wraps all /org/:orgSlug/* routes with the OrganizationProvider
 */
export function OrgLayout() {
  return (
    <OrganizationProvider>
      <Outlet />
    </OrganizationProvider>
  );
}
