import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, AlertCircle, Target, Lightbulb, Clock } from 'lucide-react';

interface Insight {
  id: string;
  type: 'recommendation' | 'alert' | 'trend' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  timestamp: string;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      case 'alert': return <AlertCircle className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'prediction': return <Target className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getImpactClass = (impact: string) => {
    switch (impact) {
      case 'high': return 'status-negative';
      case 'medium': return 'bg-warning/20 text-warning border border-warning/30';
      case 'low': return 'status-positive';
      default: return 'status-neutral';
    }
  };

  return (
    <div className="glass glass-hover rounded-lg p-4 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-primary">{getTypeIcon(insight.type)}</div>
          <span className="text-xs text-muted-foreground capitalize">{insight.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getImpactClass(insight.impact)}`}>
            {insight.impact} impact
          </span>
          <span className="text-xs text-muted-foreground">{insight.confidence}% confident</span>
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground mb-2">{insight.title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        {insight.timestamp}
      </div>
    </div>
  );
};

const AlertCard: React.FC<{ alert: Alert }> = ({ alert }) => {
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'status-negative';
      case 'warning': return 'bg-warning/20 text-warning border border-warning/30';
      case 'info': return 'status-positive';
      default: return 'status-neutral';
    }
  };

  return (
    <div className={`glass glass-hover rounded-lg p-3 ${alert.resolved ? 'opacity-60' : 'animate-pulse-glow'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`text-xs px-2 py-1 rounded-full ${getSeverityClass(alert.severity)}`}>
          {alert.severity}
        </div>
        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
      </div>
      
      <p className="text-sm text-foreground">{alert.message}</p>
      
      {alert.resolved && (
        <div className="mt-2 text-xs text-success">✓ Resolved</div>
      )}
    </div>
  );
};

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([
    {
      id: '1',
      type: 'recommendation',
      title: 'Optimize Agent Scheduling',
      description: 'Peak call volume detected between 1-3 PM. Consider adding 2 more agents during this window.',
      impact: 'high',
      confidence: 87,
      timestamp: '5 min ago'
    },
    {
      id: '2',
      type: 'trend',
      title: 'Improving Sentiment Trend',
      description: 'Customer sentiment has improved by 15% over the past week following agent training.',
      impact: 'medium',
      confidence: 92,
      timestamp: '12 min ago'
    },
    {
      id: '3',
      type: 'prediction',
      title: 'Expected Call Volume Spike',
      description: 'Model predicts 40% increase in calls tomorrow due to new product launch.',
      impact: 'high',
      confidence: 78,
      timestamp: '18 min ago'
    },
    {
      id: '4',
      type: 'alert',
      title: 'Resolution Time Increase',
      description: 'Average resolution time has increased by 25% for transaction disputes.',
      impact: 'medium',
      confidence: 95,
      timestamp: '25 min ago'
    }
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      severity: 'critical',
      message: 'System response time exceeded 5 seconds - investigating',
      timestamp: '2 min ago',
      resolved: false
    },
    {
      id: '2',
      severity: 'warning',
      message: 'Queue wait time approaching SLA threshold',
      timestamp: '8 min ago',
      resolved: false
    },
    {
      id: '3',
      severity: 'info',
      message: 'Monthly satisfaction target reached',
      timestamp: '15 min ago',
      resolved: true
    }
  ]);

  // Simulate new insights and alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const newInsightTypes = ['recommendation', 'trend', 'prediction', 'alert'];
      const newInsight: Insight = {
        id: Date.now().toString(),
        type: newInsightTypes[Math.floor(Math.random() * newInsightTypes.length)] as any,
        title: `AI Generated Insight #${Date.now().toString().slice(-4)}`,
        description: 'New pattern detected in customer interaction data requiring attention.',
        impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        confidence: Math.floor(Math.random() * 30) + 70,
        timestamp: 'Just now'
      };

      setInsights(prev => [newInsight, ...prev.slice(0, 3)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Insights
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Active</span>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Alerts</h3>
        <div className="space-y-3">
          {alerts.filter(alert => !alert.resolved).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Latest Insights</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* Intelligence Summary */}
      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Intelligence Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-hover rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">94%</div>
            <div className="text-sm text-muted-foreground">Model Accuracy</div>
          </div>
          <div className="glass-hover rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">127</div>
            <div className="text-sm text-muted-foreground">Predictions Today</div>
          </div>
        </div>
      </div>
    </div>
  );
};