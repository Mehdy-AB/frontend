// components/comments/CommentCountBadge.tsx
'use client';

import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { commentService } from '../../api/services/commentService';

interface CommentCountBadgeProps {
  entityType: 'DOCUMENT' | 'FOLDER';
  entityId: number;
  showIcon?: boolean;
  className?: string;
}

export default function CommentCountBadge({ 
  entityType, 
  entityId, 
  showIcon = true,
  className = ''
}: CommentCountBadgeProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await commentService.getCommentCount(entityType, entityId);
        setCount(response.count);
      } catch (error) {
        console.error('Error fetching comment count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-xs text-neutral-text-light ${className}`}>
        {showIcon && <MessageSquare className="h-3 w-3" />}
        <span className="h-3 w-4 bg-neutral-ui rounded animate-pulse"></span>
      </div>
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 text-xs text-neutral-text-light ${className}`}>
      {showIcon && <MessageSquare className="h-3 w-3" />}
      <span>{count}</span>
    </div>
  );
}


