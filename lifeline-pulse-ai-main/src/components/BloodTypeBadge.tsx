import { Badge } from '@/components/ui/badge';
import { BloodGroup } from '@/types/emergency';
import { Droplet } from 'lucide-react';

interface BloodTypeBadgeProps {
  bloodGroup: BloodGroup;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function BloodTypeBadge({ bloodGroup, size = 'md', showIcon = true }: BloodTypeBadgeProps) {
  const getVariant = (): 'blood-o' | 'blood-a' | 'blood-b' | 'blood-ab' => {
    if (bloodGroup.startsWith('O')) return 'blood-o';
    if (bloodGroup.startsWith('A') && !bloodGroup.startsWith('AB')) return 'blood-a';
    if (bloodGroup.startsWith('B')) return 'blood-b';
    return 'blood-ab';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Badge variant={getVariant()} className={`${sizeClasses[size]} inline-flex items-center gap-1.5`}>
      {showIcon && <Droplet className={`${iconSizes[size]} fill-current`} />}
      <span className="font-bold">{bloodGroup}</span>
    </Badge>
  );
}
