import React from 'react';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { RecentCallsFeed } from '@/components/dashboard/RecentCallsFeed';
import { ProblemAnalysis } from '@/components/dashboard/ProblemAnalysis';
import { AIInsights } from '@/components/dashboard/AIInsights';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Financial Services Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Real-time call analytics and customer service intelligence
        </p>
      </div>

      {/* Live Metrics Bar */}
      <MetricsBar />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Calls Feed - Left Column */}
        <div className="lg:col-span-1">
          <RecentCallsFeed />
        </div>

        {/* Problem Analysis - Center Columns */}
        <div className="lg:col-span-2">
          <ProblemAnalysis />
        </div>

        {/* AI Insights - Right Column */}
        <div className="lg:col-span-1">
          <AIInsights />
        </div>
      </div>
    </div>
  );
};