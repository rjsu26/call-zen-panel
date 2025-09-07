import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Clock, User, AlertTriangle } from 'lucide-react';

interface Case {
  id: string;
  customerId: string;
  customerName: string;
  agentName: string;
  caseSummary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
}

const CaseCard: React.FC<{ case: Case }> = ({ case: caseData }) => {
  const navigate = useNavigate();

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
      onClick={() => navigate(`/case/${caseData.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{caseData.customerName}</h3>
            <p className="text-xs text-muted-foreground">ID: {caseData.customerId}</p>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full border ${getSentimentColor(caseData.sentiment)}`}>
          {caseData.sentiment}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">{caseData.caseSummary}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            {caseData.agentName}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(caseData.severity)}`}>
            {caseData.severity}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{caseData.timestamp}</div>
      </div>
    </div>
  );
};

export const CaseGallery: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([
    {
      id: '1',
      customerId: 'CC789654321',
      customerName: 'Sarah Mitchell',
      agentName: 'Marcus Thompson',
      caseSummary: 'Customer reported unauthorized charges on their credit card. Two unrecognized transactions totaling $217.49 were disputed.',
      sentiment: 'positive',
      severity: 'High',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      customerId: 'CC123456789',
      customerName: 'Emily Chen',
      agentName: 'Alex Rivera',
      caseSummary: 'App payment processing error preventing transactions for two consecutive days. Issue resolved with provisional credit.',
      sentiment: 'negative',
      severity: 'Medium',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      customerId: 'CC987654321',
      customerName: 'Michael Brown',
      agentName: 'Emma Davis',
      caseSummary: 'Website crash preventing online payments. Customer expressed urgency due to approaching deadline.',
      sentiment: 'negative',
      severity: 'High',
      timestamp: '6 hours ago'
    },
    {
      id: '4',
      customerId: 'CC456789123',
      customerName: 'Jennifer Liu',
      agentName: 'James Wilson',
      caseSummary: 'Inquiry about credit utilization and effective management strategies. Provided educational guidance.',
      sentiment: 'positive',
      severity: 'Low',
      timestamp: '8 hours ago'
    },
    {
      id: '5',
      customerId: 'CC321654987',
      customerName: 'Robert Martinez',
      agentName: 'Sophie Lee',
      caseSummary: 'Credit limit increase request approved. Customer satisfied with the outcome.',
      sentiment: 'positive',
      severity: 'Low',
      timestamp: '10 hours ago'
    }
  ]);

  // Simulate new cases coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const newCase: Case = {
        id: Date.now().toString(),
        customerId: `CC${Math.floor(Math.random() * 1000000000)}`,
        customerName: ['John Doe', 'Jane Smith', 'Mark Wilson', 'Emily Chen'][Math.floor(Math.random() * 4)],
        agentName: ['Alex Chen', 'Emma Davis', 'James Wilson', 'Sophie Lee'][Math.floor(Math.random() * 4)],
        caseSummary: [
          'Payment processing issue resolved',
          'Account security concern addressed',
          'Transaction dispute handled',
          'Credit inquiry assistance provided'
        ][Math.floor(Math.random() * 4)],
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
        severity: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] as any,
        timestamp: 'Just now'
      };

      setCases(prev => [newCase, ...prev.slice(0, 4)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Case Gallery</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {cases.map((caseData) => (
          <CaseCard key={caseData.id} case={caseData} />
        ))}
      </div>
    </div>
  );
};