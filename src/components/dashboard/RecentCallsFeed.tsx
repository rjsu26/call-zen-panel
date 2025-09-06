import React, { useEffect, useState } from 'react';
import { Phone, Clock, User } from 'lucide-react';

interface Call {
  id: string;
  customerName: string;
  customerTier: 'Platinum' | 'Gold' | 'Basic';
  sentiment: 'positive' | 'negative' | 'neutral';
  duration: string;
  issue: string;
  timestamp: string;
  agentName: string;
}

const CallCard: React.FC<{ call: Call }> = ({ call }) => {
  const getTierClass = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'tier-platinum';
      case 'Gold': return 'tier-gold';
      default: return 'tier-basic';
    }
  };

  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'status-positive';
      case 'negative': return 'status-negative';
      default: return 'status-neutral';
    }
  };

  return (
    <div className="glass glass-hover rounded-lg p-4 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{call.customerName}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getTierClass(call.customerTier)}`}>
              {call.customerTier}
            </span>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${getSentimentClass(call.sentiment)}`}>
          {call.sentiment}
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{call.issue}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {call.agentName}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {call.duration}
          </div>
          <span>{call.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export const RecentCallsFeed: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([
    {
      id: '1',
      customerName: 'Sarah Johnson',
      customerTier: 'Platinum',
      sentiment: 'positive',
      duration: '12:34',
      issue: 'Account balance inquiry resolved successfully',
      timestamp: '2 min ago',
      agentName: 'Alex Chen'
    },
    {
      id: '2',
      customerName: 'Michael Brown',
      customerTier: 'Gold',
      sentiment: 'negative',
      duration: '18:22',
      issue: 'Transaction dispute - requires follow-up',
      timestamp: '5 min ago',
      agentName: 'Emma Davis'
    },
    {
      id: '3',
      customerName: 'Lisa Wang',
      customerTier: 'Basic',
      sentiment: 'neutral',
      duration: '8:15',
      issue: 'Password reset assistance provided',
      timestamp: '8 min ago',
      agentName: 'James Wilson'
    },
    {
      id: '4',
      customerName: 'Robert Martinez',
      customerTier: 'Platinum',
      sentiment: 'positive',
      duration: '15:45',
      issue: 'Investment portfolio review completed',
      timestamp: '12 min ago',
      agentName: 'Sophie Lee'
    },
    {
      id: '5',
      customerName: 'Amanda Foster',
      customerTier: 'Gold',
      sentiment: 'negative',
      duration: '22:18',
      issue: 'Credit card fraud report - escalated',
      timestamp: '15 min ago',
      agentName: 'David Kim'
    }
  ]);

  // Simulate new calls coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const newCall: Call = {
        id: Date.now().toString(),
        customerName: ['John Doe', 'Jane Smith', 'Mark Wilson', 'Emily Chen'][Math.floor(Math.random() * 4)],
        customerTier: ['Platinum', 'Gold', 'Basic'][Math.floor(Math.random() * 3)] as any,
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
        duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        issue: [
          'Account balance inquiry',
          'Transaction dispute',
          'Password reset assistance',
          'Investment consultation',
          'Credit card activation'
        ][Math.floor(Math.random() * 5)],
        timestamp: 'Just now',
        agentName: ['Alex Chen', 'Emma Davis', 'James Wilson', 'Sophie Lee'][Math.floor(Math.random() * 4)]
      };

      setCalls(prev => [newCall, ...prev.slice(0, 4)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Recent Calls</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {calls.map((call) => (
          <CallCard key={call.id} call={call} />
        ))}
      </div>
    </div>
  );
};