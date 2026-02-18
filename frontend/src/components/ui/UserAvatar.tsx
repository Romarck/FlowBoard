import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, avatarUrl, size = 'sm', className }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  // Extract initials from name (e.g., "John Doe" -> "JD")
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          sizeClasses[size],
          'rounded-full object-cover',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        'rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold',
        className
      )}
      title={name}
    >
      {initials || '?'}
    </div>
  );
}
