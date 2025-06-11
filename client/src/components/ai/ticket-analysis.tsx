import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useAnalyzeTicket, useGenerateRepairSuggestions, type TicketAnalysis, type RepairSuggestion } from "@/hooks/use-ai";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench,
  Package,
  HelpCircle,
  Zap,
  Target,
  Lightbulb
} from "lucide-react";

interface TicketAnalysisProps {
  ticketId?: number;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  onAnalysisComplete?: (analysis: TicketAnalysis) => void;
}

export default function TicketAnalysisComponent({ 
  ticketId, 
  deviceBrand, 
  deviceModel, 
  issueDescription,
  onAnalysisComplete 
}: TicketAnalysisProps) {
  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null);
  const [repairSuggestions, setRepairSuggestions] = useState<RepairSuggestion | null>(null);
  const [customerComplaints, setCustomerComplaints] = useState("");
  const [diagnosedIssue, setDiagnosedIssue] = useState("");
  const { toast } = useToast();

  const analyzeTicketMutation = useAnalyzeTicket();
  const repairSuggestionsMutation = useGenerateRepairSuggestions();

  const handleAnalyzeTicket = async () => {
    try {
      const complaints = customerComplaints
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());

      const result = await analyzeTicketMutation.mutateAsync({
        ticketId,
        deviceBrand,
        deviceModel,
        issueDescription,
        customerComplaints: complaints.length > 0 ? complaints : undefined,
      });

      setAnalysis(result);
      onAnalysisComplete?.(result);
      
      toast({
        title: "Analysis Complete",
        description: `AI analysis completed with ${Math.round(result.confidenceScore * 100)}% confidence`,
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze ticket",
        variant: "destructive",
      });
    }
  };

  const handleGenerateRepairSuggestions = async () => {
    if (!diagnosedIssue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the diagnosed issue first",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await repairSuggestionsMutation.mutateAsync({
        deviceBrand,
        deviceModel,
        diagnosedIssue,
        availableParts: analysis?.recommendedParts,
      });

      setRepairSuggestions(result);
      
      toast({
        title: "Repair Guide Generated",
        description: `${result.steps.length} repair steps generated`,
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate repair suggestions",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "expert": return "bg-purple-100 text-purple-800";
      case "hard": return "bg-red-100 text-red-800";
      case "medium": return "bg-orange-100 text-orange-800";
      case "easy": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Ticket Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Additional Customer Complaints (optional)
            </label>
            <Textarea
              placeholder="Enter any additional symptoms or complaints from the customer..."
              value={customerComplaints}
              onChange={(e) => setCustomerComplaints(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleAnalyzeTicket}
            disabled={analyzeTicketMutation.isPending}
            className="w-full"
          >
            {analyzeTicketMutation.isPending ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze Ticket with AI
              </>
            )}
          </Button>

          {analysis && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Suggested Priority</label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(analysis.priority)}>
                      {analysis.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estimated Difficulty</label>
                  <div className="mt-1">
                    <Badge className={getDifficultyColor(analysis.estimatedDifficulty)}>
                      {analysis.estimatedDifficulty.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Estimated Time</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{analysis.estimatedTimeHours} hours</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Confidence Score</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{Math.round(analysis.confidenceScore * 100)}%</span>
                  </div>
                </div>
              </div>

              {analysis.suggestedActions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Suggested Actions
                  </label>
                  <ul className="space-y-1">
                    {analysis.suggestedActions.map((action, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recommendedParts.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                    <Package className="w-4 h-4" />
                    Recommended Parts
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendedParts.map((part, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {part}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysis.diagnosticQuestions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                    <HelpCircle className="w-4 h-4" />
                    Diagnostic Questions
                  </label>
                  <ul className="space-y-1">
                    {analysis.diagnosticQuestions.map((question, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-500">?</span>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.riskFactors.length > 0 && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Risk Factors:</strong>
                    <ul className="mt-1 space-y-1">
                      {analysis.riskFactors.map((risk, index) => (
                        <li key={index} className="text-sm">• {risk}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repair Suggestions Section */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-green-600" />
              AI Repair Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Diagnosed Issue
              </label>
              <Textarea
                placeholder="Enter the specific diagnosed issue to generate repair instructions..."
                value={diagnosedIssue}
                onChange={(e) => setDiagnosedIssue(e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              onClick={handleGenerateRepairSuggestions}
              disabled={repairSuggestionsMutation.isPending || !diagnosedIssue.trim()}
              className="w-full"
              variant="outline"
            >
              {repairSuggestionsMutation.isPending ? (
                <>
                  <Lightbulb className="w-4 h-4 mr-2 animate-pulse" />
                  Generating Repair Guide...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Generate Repair Instructions
                </>
              )}
            </Button>

            {repairSuggestions && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Repair Difficulty</label>
                    <div className="mt-1">
                      <Badge className={getDifficultyColor(repairSuggestions.difficulty)}>
                        {repairSuggestions.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estimated Time</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{repairSuggestions.estimatedTime} hours</span>
                    </div>
                  </div>
                </div>

                {repairSuggestions.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Safety Warnings:</strong>
                      <ul className="mt-1 space-y-1">
                        {repairSuggestions.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">⚠️ {warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                    <Wrench className="w-4 h-4" />
                    Required Tools
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {repairSuggestions.tools.map((tool, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                    <Package className="w-4 h-4" />
                    Required Parts
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {repairSuggestions.parts.map((part, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {part}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                    <Zap className="w-4 h-4" />
                    Repair Steps
                  </label>
                  <ol className="space-y-2">
                    {repairSuggestions.steps.map((step, index) => (
                      <li key={index} className="text-sm text-gray-700 flex gap-3">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}