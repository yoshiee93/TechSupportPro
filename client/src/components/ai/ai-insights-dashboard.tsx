import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAIInsights, usePrioritizeTickets } from "@/hooks/use-ai";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  BarChart3,
  Zap,
  Target
} from "lucide-react";

export default function AIInsightsDashboard() {
  const { data: insights, isLoading, refetch } = useAIInsights();
  const prioritizeTicketsMutation = usePrioritizeTickets();
  const { toast } = useToast();

  const handlePrioritizeTickets = async () => {
    try {
      const result = await prioritizeTicketsMutation.mutateAsync({
        ticketIds: [] // Will prioritize all tickets
      });
      
      toast({
        title: "Priority Analysis Complete",
        description: `${result.priorityAdjustments.length} tickets analyzed for priority adjustments`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze ticket priorities",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-600" />
          AI Insights Dashboard
        </h2>
        <Button 
          onClick={handlePrioritizeTickets}
          disabled={prioritizeTicketsMutation.isPending}
          variant="outline"
        >
          {prioritizeTicketsMutation.isPending ? (
            <>
              <Brain className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Optimize Priorities
            </>
          )}
        </Button>
      </div>

      {insights && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">{insights.totalTickets}</p>
                    <p className="text-sm text-blue-600 flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Active workload
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Daily Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">{insights.averageTicketsPerDay}</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Daily throughput
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Most Common Device</p>
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {insights.mostCommonDevice || "N/A"}
                    </p>
                    <p className="text-sm text-orange-600 flex items-center mt-1">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Stock priority
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(insights.priorityDistribution || {}).map(([priority, count]) => (
                  <div key={priority} className="text-center">
                    <div className="mb-2">
                      <Badge 
                        className={`${
                          priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{count as number}</p>
                    <p className="text-sm text-gray-600">tickets</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}