import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeStatisticsBadgeProps {
    waitingCount?: number;
    loading?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
}

export default function NodeStatisticsBadge({
    waitingCount,
    loading,
    onClick,
    className,
}: NodeStatisticsBadgeProps) {
    if (loading) {
        return (
            <Badge
                variant="secondary"
                className={cn("absolute -top-3 -right-3 z-50 shadow-sm border bg-white dark:bg-gray-800", className)}
            >
                <Loader2 className="h-3 w-3 animate-spin" />
            </Badge>
        );
    }

    if (waitingCount === undefined || waitingCount === 0) {
        return null;
    }

    return (
        <Badge
            variant="destructive"
            className={cn(
                "absolute -top-3 -right-3 z-50 shadow-md cursor-pointer hover:scale-110 transition-transform",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}
        >
            {waitingCount}
        </Badge>
    );
}
