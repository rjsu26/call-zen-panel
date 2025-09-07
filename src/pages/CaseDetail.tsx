import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { api, CallTranscript } from '../lib/api';

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

interface CaseDetailProps {
  caseId: string;
  customerId: string;
  customerName: string;
  agentName: string;
  caseSummary: string;
  severity: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  fullTranscript: string;
  duration: string;
  timestamp: string;
  category: string;
}

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseDetailProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const mapTranscriptToDisplayCase = (transcript: CallTranscript, analyses: CaseAnalysis[]): CaseDetailProps => {
    // Find matching AI analysis by multiple strategies
    const transcriptIdStr = transcript.id?.toString();
    const paddedId = transcriptIdStr ? transcriptIdStr.padStart(3, '0') : '';
    
    const aiAnalysis = analyses.find(analysis => {
      // Try exact ID match first
      if (analysis.id === transcriptIdStr) return true;
      
      // Try matching with "CASE-" prefix and padded number
      if (analysis.id === `CASE-${paddedId}`) return true;
      
      // Try customer ID match
      if (analysis.customerId === transcript.customer_unique_id) return true;
      
      // Try customer name match (case insensitive)
      if (analysis.customerName?.toLowerCase() === transcript.customer_name?.toLowerCase()) return true;
      
      return false;
    });

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
      console.log('Using AI-generated summary for case', transcriptIdStr, ':', aiAnalysis.caseSummary);
      caseSummary = aiAnalysis.caseSummary;
    } else {
      console.log('No AI analysis found for case', transcriptIdStr, 'falling back to transcript excerpt');
      console.log('Available analyses:', analyses.map(a => ({ id: a.id, customerId: a.customerId, customerName: a.customerName })));
      console.log('Current transcript:', { id: transcriptIdStr, customerId: transcript.customer_unique_id, customerName: transcript.customer_name });
      // Fallback: create case summary from transcript excerpt
      caseSummary = transcript.call_transcript
        .split('\n')
        .slice(4, 8)
        .join(' ')
        .replace(/Customer:|Agent:/g, '')
        .trim()
        .substring(0, 150) + '...';
    }

    return {
      caseId: transcript.id?.toString() || id || '1',
      customerId: transcript.customer_unique_id,
      customerName: transcript.customer_name,
      agentName: transcript.support_agent_name,
      caseSummary,
      severity: (aiAnalysis?.severity || transcript.issue_severity) as 'High' | 'Medium' | 'Low',
      sentiment,
      fullTranscript: transcript.call_transcript,
      duration,
      timestamp,
      category: transcript.category_of_call
    };
  };

  // Fetch case data from API
  const fetchCaseData = async () => {
    if (!id) {
      setError('No case ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load case analyses and transcript data in parallel
      const [analyses, response] = await Promise.all([
        loadCaseAnalyses(),
        api.getTranscriptById(parseInt(id))
      ]);
      
      const displayCase = mapTranscriptToDisplayCase(response, analyses);
      setCaseData(displayCase);
      setError(null);
    } catch (err) {
      console.error('Error fetching case data:', err);
      setError('Failed to load case data');
      
      // Fallback to mock data if API fails
      const mockCase: CaseDetailProps = {
        caseId: id || '1',
        customerId: 'CC789654321',
        customerName: 'Sarah Mitchell',
        agentName: 'Marcus Thompson',
        caseSummary: 'Customer reported unauthorized charges on their credit card. Two unrecognized transactions totaling $217.49 were disputed.',
        severity: 'High',
        sentiment: 'positive',
        fullTranscript: 'Customer: Hi, I need to report some unauthorized charges on my credit card.\nAgent: I\'m sorry to hear that. I\'ll help you resolve this right away. Can you tell me more about the charges?\nCustomer: There are two transactions I don\'t recognize, totaling $217.49.\nAgent: I understand your concern. Let me flag these transactions for dispute immediately...',
        duration: '12:34',
        timestamp: '2 hours ago',
        category: 'Fraud Reporting'
      };
      setCaseData(mockCase);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case Gallery
          </button>
          
          <div className="glass rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading case details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case Gallery
          </button>
          
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-destructive">Error: {error || 'Case not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Case Gallery
        </button>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Case Details</h1>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(caseData.sentiment)}`}>
                {caseData.sentiment}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(caseData.severity)}`}>
                {caseData.severity} Severity
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-semibold">{caseData.customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer ID</p>
                  <p className="font-semibold">{caseData.customerId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Agent Name</p>
                  <p className="font-semibold">{caseData.agentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Case ID</p>
                  <p className="font-semibold">{caseData.caseId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-semibold">{caseData.category}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{caseData.duration}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{caseData.timestamp}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Case Summary</h3>
              <p className="text-muted-foreground leading-relaxed">{caseData.caseSummary}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Full Transcript</h3>
              <div className="glass rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {caseData.fullTranscript}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
