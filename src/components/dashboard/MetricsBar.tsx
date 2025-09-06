import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, Phone, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { api, DashboardStats } from '../../lib/api';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  pulse?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, icon, pulse }) => (
  <div className={`glass glass-hover rounded-xl p-4 ${pulse ? 'pulse-primary' : ''}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
        isPositive ? 'status-positive' : 'status-negative'
      }`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {change}
      </div>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
  </div>
);

export const MetricsBar: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [previousStats, setPreviousStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const newStats = await api.getDashboardStats();
      
      // Store previous stats for trend calculation
      if (stats) {
        setPreviousStats(stats);
      }
      
      setStats(newStats);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate percentage change between current and previous values
  const calculateChange = (current: number, previous: number | undefined): { value: string, isPositive: boolean } => {
    if (previous === undefined || previous === 0) {
      return { value: "N/A", isPositive: true };
    }
    
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;
    return { 
      value: `${Math.abs(change).toFixed(1)}%`, 
      isPositive 
    };
  };

  // If loading and no data yet, show loading state
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 animate-fade-in">
        {Array(6).fill(0).map((_, index) => (
          <div key={index} className="glass rounded-xl p-4 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ))}
      </div>
    );
  }

  // If error, show error state
  if (error) {
    return (
      <div className="glass rounded-xl p-4 mb-6 text-red-500 flex items-center justify-center">
        <AlertTriangle className="mr-2" /> {error}
      </div>
    );
  }

  // If no stats yet, don't render
  if (!stats) return null;

  // Calculate resolution percentage
  const resolvedPercentage = stats.callsByResolution.find(r => r.status === 'Resolved')?.count || 0;
  const totalResolutionCalls = stats.callsByResolution.reduce((sum, item) => sum + item.count, 0);
  const resolvedRate = totalResolutionCalls > 0 
    ? Math.round((resolvedPercentage / totalResolutionCalls) * 100) 
    : 0;

  // Calculate active alerts (count of high severity unresolved issues)
  const highSeverityCount = stats.callsBySeverity.find(s => s.severity === 'High')?.count || 0;
  
  // Prepare metrics data
  const metricsData = [
    {
      title: "Total Calls",
      value: stats.totalCalls.toLocaleString(),
      change: calculateChange(
        stats.totalCalls, 
        previousStats?.totalCalls
      ).value,
      isPositive: calculateChange(
        stats.totalCalls, 
        previousStats?.totalCalls
      ).isPositive,
      icon: <Phone className="w-4 h-4" />,
      pulse: true
    },
    {
      title: "Agent Count",
      value: (new Set(stats.callsByCategory.map(c => c.category))).size.toString(),
      change: "N/A",
      isPositive: true,
      icon: <Users className="w-4 h-4" />
    },
    {
      title: "Avg Call Duration",
      value: `${Math.round(stats.averageCallDuration)}m`,
      change: calculateChange(
        stats.averageCallDuration,
        previousStats?.averageCallDuration
      ).value,
      isPositive: calculateChange(
        stats.averageCallDuration,
        previousStats?.averageCallDuration
      ).isPositive === false, // Lower duration is positive
      icon: <Clock className="w-4 h-4" />
    },
    {
      title: "Satisfaction",
      value: stats.averageSatisfactionScore.toFixed(1),
      change: calculateChange(
        stats.averageSatisfactionScore,
        previousStats?.averageSatisfactionScore
      ).value,
      isPositive: calculateChange(
        stats.averageSatisfactionScore,
        previousStats?.averageSatisfactionScore
      ).isPositive,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      title: "Resolved Issues",
      value: `${resolvedRate}%`,
      change: calculateChange(
        resolvedRate,
        previousStats ? (previousStats.callsByResolution.find(r => r.status === 'Resolved')?.count || 0) / 
          (previousStats.callsByResolution.reduce((sum, item) => sum + item.count, 0) || 1) * 100 : undefined
      ).value,
      isPositive: calculateChange(
        resolvedRate,
        previousStats ? (previousStats.callsByResolution.find(r => r.status === 'Resolved')?.count || 0) / 
          (previousStats.callsByResolution.reduce((sum, item) => sum + item.count, 0) || 1) * 100 : undefined
      ).isPositive,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      title: "Follow-up Required",
      value: stats.followUpRequiredCount.toString(),
      change: calculateChange(
        stats.followUpRequiredCount,
        previousStats?.followUpRequiredCount
      ).value,
      isPositive: calculateChange(
        stats.followUpRequiredCount,
        previousStats?.followUpRequiredCount
      ).isPositive === false, // Lower follow-up count is positive
      icon: <AlertTriangle className="w-4 h-4" />,
      pulse: stats.followUpRequiredCount > 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 animate-fade-in">
      {metricsData.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};
