import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Clock, User, Loader2, AlertTriangle } from 'lucide-react';
import { api, CallTranscript } from '../../lib/api';

// Interface for AI-generated case analysis
interface CaseAnalysis {
  id: string;
  customerId: string;
  customerName: string;
  agentName: string;
  caseSummary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
}

// Interface for the display-formatted call data
interface DisplayCall {
  id: string;
  customerId: string;
  customerName: string;
  customerTier: 'Platinum' | 'Gold' | 'Basic' | string;
  sentiment: 'positive' | 'negative' | 'neutral';
  duration: string;
  issue: string;
  timestamp: string;
  agentName: string;
  caseSummary: string;
  severity: 'High' | 'Medium' | 'Low';
}

const CallCard: React.FC<{ call: DisplayCall }> = ({ call }) => {
  const navigate = useNavigate();

  const getTierClass = (tier: string) => {
    switch (tier) {
      case 'Premium':
      case 'Platinum': return 'tier-platinum';
      case 'Gold': return 'tier-gold';
      default: return 'tier-basic';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div
      className="glass glass-hover rounded-lg p-4 animate-slide-up cursor-pointer"
      onClick={() => navigate(`/case/${call.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{call.customerName}</h3>
            <p className="text-xs text-muted-foreground">ID: {call.customerId}</p>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full border ${getSentimentColor(call.sentiment)}`}>
          {call.sentiment}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">{call.caseSummary}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            {call.agentName}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(call.severity)}`}>
            {call.severity}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{call.timestamp}</div>
      </div>
    </div>
  );
};

export const RecentCallsFeed: React.FC = () => {
  const [calls, setCalls] = useState<DisplayCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseAnalyses, setCaseAnalyses] = useState<CaseAnalysis[]>([]);

  // Load AI-generated case analyses
  const loadCaseAnalyses = async (): Promise<CaseAnalysis[]> => {
    try {
      const response = await fetch('/case_analyses.json');
      if (!response.ok) {
        console.warn('Could not load case analyses, falling back to empty array');
        return [];
      }
      return await response.json();
    } catch (error) {
      console.warn('Error loading case analyses:', error);
      return [];
    }
  };

  // Convert API call transcript to display format using AI analysis when available
  const mapTranscriptToDisplayCall = (transcript: CallTranscript, analyses: CaseAnalysis[]): DisplayCall => {
    // Find matching AI analysis by transcript ID or customer ID
    const transcriptIdStr = transcript.id?.toString();
    const aiAnalysis = analyses.find(analysis => 
      analysis.id === transcriptIdStr || 
      analysis.customerId === transcript.customer_unique_id
    );

    // Map satisfaction score to sentiment (fallback if no AI analysis)
    let sentiment: 'positive' | 'negative' | 'neutral';
    if (aiAnalysis) {
      sentiment = aiAnalysis.sentiment;
    } else {
      if (transcript.overall_satisfaction_score >= 7) {
        sentiment = 'positive';
      } else if (transcript.overall_satisfaction_score <= 4) {
        sentiment = 'negative';
      } else {
        sentiment = 'neutral';
      }
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

    // Use AI-generated case summary if available, otherwise create one from transcript
    let caseSummary: string;
    if (aiAnalysis && aiAnalysis.caseSummary) {
      caseSummary = aiAnalysis.caseSummary;
    } else {
      // Fallback: create case summary from transcript excerpt
      caseSummary = transcript.call_transcript
        .split('\n')
        .slice(4, 8) // Skip greeting lines, get issue description
        .join(' ')
        .replace(/Customer:|Agent:/g, '')
        .trim()
        .substring(0, 150) + '...';
    }

    return {
      id: transcript.id?.toString() || Date.now().toString(),
      customerId: transcript.customer_unique_id,
      customerName: transcript.customer_name,
      customerTier: transcript.customer_tier,
      sentiment,
      duration,
      issue: transcript.category_of_call,
      timestamp,
      agentName: transcript.support_agent_name,
      caseSummary,
      severity: (aiAnalysis?.severity || transcript.issue_severity) as 'High' | 'Medium' | 'Low'
    };
  };

  // Fetch recent calls from API
  const fetchRecentCalls = async () => {
    try {
      setLoading(true);
      
      // Load case analyses and recent calls in parallel
      const [analyses, response] = await Promise.all([
        loadCaseAnalyses(),
        api.getAllTranscripts(undefined, { page: 1, limit: 5 })
      ]);
      
      setCaseAnalyses(analyses);
      
      // Map API data to display format using AI analyses
      const displayCalls = response.transcripts.map(transcript => 
        mapTranscriptToDisplayCall(transcript, analyses)
      );
      setCalls(displayCalls);
      setError(null);
    } catch (err) {
      console.error('Error fetching recent calls:', err);
      setError('Failed to load recent calls');
      
      // Fallback to mock data if API fails
      const mockCalls: DisplayCall[] = [
        {
          id: '1',
          customerId: 'CC789654321',
          customerName: 'Sarah Mitchell',
          customerTier: 'Premium',
          agentName: 'Marcus Thompson',
          caseSummary: 'Customer reported unauthorized charges on their credit card. Two unrecognized transactions totaling $217.49 were disputed.',
          sentiment: 'positive',
          severity: 'High',
          timestamp: '2 hours ago',
          duration: '12:34',
          issue: 'Fraud Reporting'
        },
        {
          id: '2',
          customerId: 'CC123456789',
          customerName: 'Emily Chen',
          customerTier: 'Elite',
          agentName: 'Alex Rivera',
          caseSummary: 'App payment processing error preventing transactions for two consecutive days. Issue resolved with provisional credit.',
          sentiment: 'negative',
          severity: 'Medium',
          timestamp: '4 hours ago',
          duration: '18:15',
          issue: 'Technical Support'
        },
        {
          id: '3',
          customerId: 'CC987654321',
          customerName: 'Michael Brown',
          customerTier: 'Premium',
          agentName: 'Emma Davis',
          caseSummary: 'Website crash preventing online payments. Customer expressed urgency due to approaching deadline.',
          sentiment: 'negative',
          severity: 'High',
          timestamp: '6 hours ago',
          duration: '16:42',
          issue: 'System Technical Issue'
        }
      ];
      setCalls(mockCalls);
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

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Case Gallery</h2>
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
