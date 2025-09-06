import React, { useEffect, useState } from 'react';
import { Phone, Clock, User, Loader2, AlertTriangle } from 'lucide-react';
import { api, CallTranscript } from '../../lib/api';

// Interface for the display-formatted call data
interface DisplayCall {
  id: string;
  customerName: string;
  customerTier: 'Platinum' | 'Gold' | 'Basic' | string;
  sentiment: 'positive' | 'negative' | 'neutral';
  duration: string;
  issue: string;
  timestamp: string;
  agentName: string;
}

const CallCard: React.FC<{ call: DisplayCall }> = ({ call }) => {
  const getTierClass = (tier: string) => {
    switch (tier) {
      case 'Premium':
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
  const [calls, setCalls] = useState<DisplayCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert API call transcript to display format
  const mapTranscriptToDisplayCall = (transcript: CallTranscript): DisplayCall => {
    // Map satisfaction score to sentiment
    let sentiment: 'positive' | 'negative' | 'neutral';
    if (transcript.overall_satisfaction_score >= 7) {
      sentiment = 'positive';
    } else if (transcript.overall_satisfaction_score <= 4) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    // Format duration from minutes to MM:SS
    const minutes = Math.floor(transcript.call_duration);
    const seconds = Math.round((transcript.call_duration - minutes) * 60);
    const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Format timestamp as relative time
    const callDate = new Date(transcript.call_date_time);
    const now = new Date();
    const diffMs = now.getTime() - callDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    let timestamp: string;
    if (diffMins < 1) {
      timestamp = 'Just now';
    } else if (diffMins < 60) {
      timestamp = `${diffMins} min ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      timestamp = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      timestamp = `${days} day${days > 1 ? 's' : ''} ago`;
    }

    return {
      id: transcript.id?.toString() || Date.now().toString(),
      customerName: transcript.customer_name,
      customerTier: transcript.customer_tier,
      sentiment,
      duration,
      issue: transcript.category_of_call,
      timestamp,
      agentName: transcript.support_agent_name
    };
  };

  // Fetch recent calls from API
  const fetchRecentCalls = async () => {
    try {
      setLoading(true);
      // Get the 5 most recent calls
      const response = await api.getAllTranscripts(
        undefined, 
        { page: 1, limit: 5 }
      );
      
      // Map API data to display format
      const displayCalls = response.transcripts.map(mapTranscriptToDisplayCall);
      setCalls(displayCalls);
      setError(null);
    } catch (err) {
      console.error('Error fetching recent calls:', err);
      setError('Failed to load recent calls');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRecentCalls();
  }, []);

  // Periodic data refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentCalls();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading && calls.length === 0) {
    return (
      <div className="glass rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading recent calls...</p>
      </div>
    );
  }

  // Error state
  if (error && calls.length === 0) {
    return (
      <div className="glass rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] text-red-500">
        <AlertTriangle className="w-8 h-8 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Recent Calls</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>
      
      {loading && calls.length > 0 && (
        <div className="flex items-center justify-center py-2 mb-4 text-xs text-primary">
          <Loader2 className="w-3 h-3 animate-spin mr-2" />
          Refreshing data...
        </div>
      )}
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {calls.length > 0 ? (
          calls.map((call) => (
            <CallCard key={call.id} call={call} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No recent calls found
          </div>
        )}
      </div>
    </div>
  );
};
