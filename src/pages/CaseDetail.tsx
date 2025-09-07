import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, AlertTriangle } from 'lucide-react';

interface CaseDetailProps {
  caseId: string;
  customerId: string;
  agentName: string;
  caseSummary: string;
  severity: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock data - in real app, fetch from API or state
  const caseData: CaseDetailProps = {
    caseId: id || '1',
    customerId: 'CC789654321',
    agentName: 'Marcus Thompson',
    caseSummary: 'Customer reported unauthorized charges on their credit card. Two unrecognized transactions totaling $217.49 were disputed. Provisional credit issued within 24 hours, new card expedited.',
    severity: 'High',
    sentiment: 'positive'
  };

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
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

            <div>
              <h3 className="text-lg font-semibold mb-3">Case Summary</h3>
              <p className="text-muted-foreground leading-relaxed">{caseData.caseSummary}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
