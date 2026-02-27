/**
 * Reusable UserAvatar component
 * 
 * Displays user avatar with fallback to initials or default icon
 * 
 * @example
 * <UserAvatar user={user} size="md" showTooltip />
 */

'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { User } from 'lucide-react';
import { UserDto } from '@/types/api';

// Partial user type for avatar - only needs basic display fields
type AvatarUser = Partial<Pick<UserDto, 'id' | 'username' | 'email' | 'firstName' | 'lastName' | 'displayName' | 'imgUrl' | 'imageUrl'>>;

interface UserAvatarProps {
  user: AvatarUser | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineStatus?: boolean;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const iconSizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export default function UserAvatar({
  user,
  size = 'md',
  className = '',
  showOnlineStatus = false,
  showTooltip = false,
}: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback>
          <User className={iconSizeClasses[size]} />
        </AvatarFallback>
      </Avatar>
    );
  }

  // Get user initials
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Get avatar image URL
  const getImageUrl = () => {
    // Check various possible image URL fields
    return user.imgUrl || user.imageUrl || (user as any).avatarUrl || null;
  };

  const imageUrl = getImageUrl();
  const initials = getInitials();
  const displayName = user.displayName || user.username || 'Unknown User';

  const avatarElement = (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        {imageUrl && (
          <AvatarImage
            src={imageUrl}
            alt={displayName}
            onError={(e) => {
              // Hide broken image on error
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {showOnlineStatus && (
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatarElement}
          </TooltipTrigger>
          <TooltipContent className="bg-white border shadow-lg p-2">
            <div className="text-sm">
              <p className="font-semibold text-gray-900">{displayName}</p>
              {user.email && (
                <p className="text-gray-500 text-xs">{user.email}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatarElement;
}
