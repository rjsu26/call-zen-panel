import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, Phone, Clock, AlertTriangle } from 'lucide-react';

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
  const [metrics, setMetrics] = useState({
    totalCalls: 2847,
    activeAgents: 12,
    avgWaitTime: 45,
    satisfaction: 4.2,
    resolved: 89,
    alerts: 3
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        totalCalls: prev.totalCalls + Math.floor(Math.random() * 3),
        avgWaitTime: Math.max(30, prev.avgWaitTime + Math.floor(Math.random() * 11) - 5),
        satisfaction: Math.max(3.0, Math.min(5.0, prev.satisfaction + (Math.random() - 0.5) * 0.1))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const metricsData = [
    {
      title: "Total Calls Today",
      value: metrics.totalCalls.toLocaleString(),
      change: "+12%",
      isPositive: true,
      icon: <Phone className="w-4 h-4" />,
      pulse: true
    },
    {
      title: "Active Agents",
      value: metrics.activeAgents.toString(),
      change: "+2",
      isPositive: true,
      icon: <Users className="w-4 h-4" />
    },
    {
      title: "Avg Wait Time",
      value: `${metrics.avgWaitTime}s`,
      change: "-8%",
      isPositive: true,
      icon: <Clock className="w-4 h-4" />
    },
    {
      title: "Satisfaction",
      value: metrics.satisfaction.toFixed(1),
      change: "+0.3",
      isPositive: true,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      title: "Resolved Issues",
      value: `${metrics.resolved}%`,
      change: "+5%",
      isPositive: true,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      title: "Active Alerts",
      value: metrics.alerts.toString(),
      change: "+1",
      isPositive: false,
      icon: <AlertTriangle className="w-4 h-4" />,
      pulse: metrics.alerts > 0
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