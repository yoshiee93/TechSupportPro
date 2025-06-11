import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Receipt, FileText, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function BillingPage() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unbilled items
  const { data: unbilledItems = [], isLoading: loadingUnbilled } = useQuery({
    queryKey: ['/api/billable-items/unbilled'],
  });

  // Fetch all sales transactions
  const { data: salesTransactions = [], isLoading: loadingSales } = useQuery({
    queryKey: ['/api/sales'],
  });

  // Mark items as billed mutation
  const markBilledMutation = useMutation({
    mutationFn: (itemIds: number[]) => 
      apiRequest('/api/billable-items/mark-billed', {
        method: 'POST',
        body: { itemIds }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billable-items/unbilled'] });
      setSelectedItems([]);
      toast({
        title: "Success",
        description: "Items marked as billed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark items as billed",
        variant: "destructive",
      });
    }
  });

  const handleSelectItem = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === unbilledItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(unbilledItems.map((item: any) => item.id));
    }
  };

  const handleGenerateBillingReport = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to bill",
        variant: "destructive",
      });
      return;
    }
    markBilledMutation.mutate(selectedItems);
  };

  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => {
      const amount = parseFloat(item.totalAmount || '0');
      const taxRate = parseFloat(item.taxRate || '0');
      const unitPrice = parseFloat(item.unitPrice || '0');
      const quantity = parseFloat(item.quantity || '1');
      
      if (item.taxInclusive) {
        return sum + amount;
      } else {
        return sum + (unitPrice * quantity);
      }
    }, 0);

    const taxAmount = items.reduce((sum, item) => {
      const unitPrice = parseFloat(item.unitPrice || '0');
      const quantity = parseFloat(item.quantity || '1');
      const taxRate = parseFloat(item.taxRate || '0');
      
      if (item.taxInclusive) {
        const baseAmount = parseFloat(item.totalAmount || '0') / (1 + taxRate / 100);
        return sum + (parseFloat(item.totalAmount || '0') - baseAmount);
      } else {
        return sum + ((unitPrice * quantity) * (taxRate / 100));
      }
    }, 0);

    return {
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: subtotal + taxAmount
    };
  };

  const selectedItemsData = unbilledItems.filter((item: any) => selectedItems.includes(item.id));
  const totals = calculateTotals(selectedItemsData);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Reports</h1>
          <p className="text-muted-foreground">
            Generate billing reports and manage sales transactions
          </p>
        </div>
      </div>

      <Tabs defaultValue="billing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Billing Reports
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Sales History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Unbilled Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUnbilled ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : unbilledItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No unbilled items found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedItems.length === unbilledItems.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label>Select All ({unbilledItems.length} items)</Label>
                    <div className="ml-auto">
                      <Button
                        onClick={handleGenerateBillingReport}
                        disabled={selectedItems.length === 0 || markBilledMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Receipt className="w-4 h-4" />
                        Generate Report ({selectedItems.length} items)
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium">
                      <div className="col-span-1"></div>
                      <div className="col-span-2">Ticket</div>
                      <div className="col-span-2">Client</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-3">Description</div>
                      <div className="col-span-1">Qty</div>
                      <div className="col-span-1">Amount</div>
                    </div>
                    
                    {unbilledItems.map((item: any) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30">
                        <div className="col-span-1">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="font-medium">{item.ticket?.ticketNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="font-medium">{item.ticket?.client?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.ticket?.device?.brand} {item.ticket?.device?.model}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Badge variant={
                            item.type === 'labor' ? 'default' :
                            item.type === 'parts' ? 'secondary' : 'outline'
                          }>
                            {item.type}
                          </Badge>
                        </div>
                        <div className="col-span-3">
                          <div className="font-medium">{item.description}</div>
                          {item.taxInclusive && (
                            <div className="text-sm text-muted-foreground">Tax inclusive</div>
                          )}
                        </div>
                        <div className="col-span-1">
                          {parseFloat(item.quantity || '1').toFixed(1)}
                        </div>
                        <div className="col-span-1 font-medium">
                          ${parseFloat(item.totalAmount || '0').toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedItems.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Billing Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${totals.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>${totals.taxAmount.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>${totals.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Sales History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div>
                    <Label htmlFor="from-date">From</Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-date">To</Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </div>

                {loadingSales ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : salesTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sales transactions found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted/50 font-medium">
                      <div>Date</div>
                      <div>Client</div>
                      <div>Items</div>
                      <div>Subtotal</div>
                      <div>Tax</div>
                      <div>Total</div>
                    </div>
                    
                    {salesTransactions.map((transaction: any) => (
                      <div key={transaction.id} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30">
                        <div>
                          <div className="font-medium">
                            {format(new Date(transaction.saleDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.saleDate), 'hh:mm a')}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{transaction.client?.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {transaction.paymentStatus}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-sm">
                            {transaction.items?.length || 0} item(s)
                          </div>
                        </div>
                        <div>${parseFloat(transaction.subtotal || '0').toFixed(2)}</div>
                        <div>${parseFloat(transaction.taxAmount || '0').toFixed(2)}</div>
                        <div className="font-medium">
                          ${parseFloat(transaction.totalAmount || '0').toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}