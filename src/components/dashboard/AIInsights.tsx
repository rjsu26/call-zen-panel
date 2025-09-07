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
  const [insights, setInsights] = useState<Insight[]>([]);

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

  // Load case analyses and compliance rules, compute violations and confidence
  useEffect(() => {
    let mounted = true;

    async function loadAndCompute() {
      try {
        const [casesRes, rulesRes] = await Promise.all([
          fetch('/case_analyses.json'),
          fetch('/data/compliance_rules_2000.json')
        ]);

        if (!casesRes.ok || !rulesRes.ok) {
          // If files are not served from root, try relative paths
          console.warn('Primary fetch failed, trying relative paths');
        }

        const cases = await casesRes.json();
        const rules = await rulesRes.json();

        const violations: Insight[] = [];

        // Simple keyword matching: for each case, check rule keywords against caseSummary
        for (const c of cases) {
          const text = (c.caseSummary || c.caseSummary || '').toLowerCase();
          for (const r of rules) {
            let matchCount = 0;
            for (const kw of r.keywords || []) {
              const k = (kw || '').toString().toLowerCase();
              if (!k) continue;
              if (text.includes(k)) matchCount++;
            }

            if (matchCount > 0) {
              // confidence heuristic
              let base = 50;
              base += Math.min(30, matchCount * 8);
              if ((r.severity || '').toLowerCase() === 'high') base += 15;
              if ((c.severity || '').toLowerCase() === 'high') base += 10;
              const confidence = Math.min(99, base);

              const impact = (r.severity || 'medium').toLowerCase() === 'high' ? 'high' : (r.severity || 'medium').toLowerCase() === 'medium' ? 'medium' : 'low';

              violations.push({
                id: `${c.id}-${r.id}`,
                type: 'alert',
                title: `${r.title} — ${c.customerName}`,
                description: r.description,
                impact: impact as any,
                confidence,
                timestamp: c.timestamp || 'Recently analyzed'
              });
            }
          }
        }

        // Sort by confidence and impact
        violations.sort((a, b) => (b.confidence - a.confidence));

        if (mounted) setInsights(violations.slice(0, 6));
      } catch (e) {
        console.error('Error loading compliance insights', e);
      }
    }

    loadAndCompute();
    return () => { mounted = false; };
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
        <h3 className="text-lg font-semibold text-foreground mb-4">Compliance Insights</h3>
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