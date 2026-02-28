'use client';

import React from 'react';
import { Server, CheckCircle, Users, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LdapStatistics } from './ldap-types';

interface LdapMetricCardsProps {
    statistics: LdapStatistics | null;
    loading: boolean;
}

interface MetricCardData {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

function MetricCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-2.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function LdapMetricCards({ statistics, loading }: LdapMetricCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <MetricCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    const cards: MetricCardData[] = [
        {
            label: 'Total Servers',
            value: statistics?.totalServers ?? 0,
            icon: <Server className="h-6 w-6" />,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
        },
        {
            label: 'Connected',
            value: statistics?.connectedServers ?? 0,
            icon: <CheckCircle className="h-6 w-6" />,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        },
        {
            label: 'Total Users',
            value: statistics?.totalLdapUsers ?? 0,
            icon: <Users className="h-6 w-6" />,
            color: 'text-violet-600 dark:text-violet-400',
            bgColor: 'bg-violet-500/10 dark:bg-violet-500/20',
        },
        {
            label: 'Total Syncs',
            value: statistics?.totalSyncs ?? 0,
            icon: <Activity className="h-6 w-6" />,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <Card
                    key={card.label}
                    className="group overflow-hidden border hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-default"
                >
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                <p className="text-2xl font-bold mt-1 tracking-tight">
                                    {card.value.toLocaleString()}
                                </p>
                            </div>
                            <div
                                className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.bgColor} ${card.color} group-hover:scale-110 transition-transform duration-300`}
                            >
                                {card.icon}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
