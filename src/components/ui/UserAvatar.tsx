'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils'; // Tailwind classes merge karne ke liye

interface UserAvatarProps {
  name?: string;       // User ka naam
  url?: string | null; // Database se aaya URL
  size?: string;       // CSS class for size (e.g., 'h-10 w-10')
  className?: string;  // Extra styles
}

export function UserAvatar({ name, url, size = "h-8 w-8", className }: UserAvatarProps) {
  
  // Initials generator (e.g. "Rahul Kumar" -> "RK")
  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return fullName[0].toUpperCase();
  };

  return (
    <Avatar className={cn(size, className)}>
      {/* 1. Agar URL hai to Image dikhao */}
      {url ? (
        <AvatarImage 
          src={url} 
          alt={name || 'User'} 
          className="object-cover" // Photo crop na ho
        />
      ) : null}

      {/* 2. Agar URL nahi hai (ya load fail hua), to Initials dikhao */}
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {getInitials(name || '')}
      </AvatarFallback>
    </Avatar>
  );
}
