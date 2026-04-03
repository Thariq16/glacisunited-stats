import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DownloadReportButtonProps {
  onGenerate: () => void;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'icon';
}

export function DownloadReportButton({ onGenerate, label, variant = 'outline', size = 'sm' }: DownloadReportButtonProps) {
  const { isAdmin, isCoach } = useAuth();

  if (!isAdmin && !isCoach) return null;

  const handleClick = () => {
    try {
      onGenerate();
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to generate report');
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleClick} title="Download HTML Report">
      <Download className="h-4 w-4" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}
