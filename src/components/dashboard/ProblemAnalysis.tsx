import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

const sentimentData = [
  { name: 'Positive', value: 65, color: '#22c55e' },
  { name: 'Neutral', value: 25, color: '#6b7280' },
  { name: 'Negative', value: 10, color: '#ef4444' }
];

const problemCategories = [
  { category: 'Account Issues', count: 45, percentage: 30 },
  { category: 'Transaction Disputes', count: 32, percentage: 21 },
  { category: 'Technical Support', count: 28, percentage: 19 },
  { category: 'Product Inquiries', count: 25, percentage: 17 },
  { category: 'Billing Questions', count: 20, percentage: 13 }
];

const hourlyTrends = [
  { hour: '9AM', calls: 45, satisfaction: 4.2 },
  { hour: '10AM', calls: 62, satisfaction: 4.1 },
  { hour: '11AM', calls: 78, satisfaction: 4.3 },
  { hour: '12PM', calls: 89, satisfaction: 4.0 },
  { hour: '1PM', calls: 95, satisfaction: 3.9 },
  { hour: '2PM', calls: 87, satisfaction: 4.1 },
  { hour: '3PM', calls: 92, satisfaction: 4.2 },
  { hour: '4PM', calls: 85, satisfaction: 4.4 }
];

const agentPerformance = [
  { name: 'Alex Chen', calls: 48, satisfaction: 4.7, resolutionRate: 95 },
  { name: 'Emma Davis', calls: 42, satisfaction: 4.5, resolutionRate: 92 },
  { name: 'James Wilson', calls: 39, satisfaction: 4.3, resolutionRate: 88 },
  { name: 'Sophie Lee', calls: 45, satisfaction: 4.6, resolutionRate: 94 },
  { name: 'David Kim', calls: 36, satisfaction: 4.2, resolutionRate: 87 }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 border border-primary/20">
        <p className="text-foreground font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-primary">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ProblemAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Sentiment Distribution */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Sentiment Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {sentimentData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-muted-foreground">{item.name} ({item.value}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Problem Categories */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Problem Categories</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={problemCategories} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="category" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Trends */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Hourly Call Volume & Satisfaction</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Line yAxisId="left" type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={3} />
              <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="hsl(var(--success))" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Performing Agents</h3>
        <div className="space-y-3">
          {agentPerformance.map((agent, index) => (
            <div key={agent.name} className="flex items-center justify-between p-3 glass-hover rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <span className="font-medium text-foreground">{agent.name}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-foreground font-semibold">{agent.calls}</div>
                  <div className="text-muted-foreground">Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-foreground font-semibold">{agent.satisfaction}</div>
                  <div className="text-muted-foreground">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-foreground font-semibold">{agent.resolutionRate}%</div>
                  <div className="text-muted-foreground">Resolved</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};