import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Receipt, DollarSign, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface TicketBillingProps {
  ticketId: number;
  clientId: number;
}

export function TicketBilling({ ticketId, clientId }: TicketBillingProps) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [itemType, setItemType] = useState<'part' | 'labor'>('part');
  const [quantity, setQuantity] = useState('1');
  const [laborHours, setLaborHours] = useState('');
  const [laborRate, setLaborRate] = useState('50');
  const [description, setDescription] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch billable items for this ticket
  const { data: billableItems = [], isLoading: loadingItems } = useQuery<any[]>({
    queryKey: ['/api/billable-items/ticket', ticketId],
  });

  // Fetch available parts
  const { data: parts = [] } = useQuery<any[]>({
    queryKey: ['/api/inventory/parts'],
  });

  // Add billable item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/billable-items', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billable-items/ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/billable-items/unbilled'] });
      setIsAddItemOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Billable item added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add billable item",
        variant: "destructive",
      });
    }
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/invoices/generate/${ticketId}`, {});
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/billable-items/ticket', ticketId] });
      toast({
        title: "Success",
        description: `Invoice #${data.invoice.invoiceNumber} generated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    }
  });

  // Delete billable item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiRequest('DELETE', `/api/billable-items/${itemId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billable-items/ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/billable-items/unbilled'] });
      toast({
        title: "Success",
        description: "Billable item removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to remove billable item",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setSelectedPartId('');
    setItemType('part');
    setQuantity('1');
    setLaborHours('');
    setLaborRate('50');
    setDescription('');
    setCustomPrice('');
  };

  const handleAddItem = () => {
    if (itemType === 'part' && !selectedPartId) {
      toast({
        title: "Error",
        description: "Please select a part",
        variant: "destructive",
      });
      return;
    }

    if (itemType === 'labor' && (!laborHours || !description)) {
      toast({
        title: "Error",
        description: "Please fill in labor hours and description",
        variant: "destructive",
      });
      return;
    }

    const selectedPart = (parts as any[]).find((p: any) => p.id === parseInt(selectedPartId));
    let itemData;

    if (itemType === 'part') {
      itemData = {
        ticketId,
        partId: parseInt(selectedPartId),
        itemType: 'part',
        description: selectedPart?.name || description,
        quantity: parseFloat(quantity),
        unitPrice: customPrice ? parseFloat(customPrice) : selectedPart?.price || 0,
        lineTotal: (customPrice ? parseFloat(customPrice) : selectedPart?.price || 0) * parseFloat(quantity),
      };
    } else {
      itemData = {
        ticketId,
        partId: null,
        itemType: 'labor',
        description,
        quantity: parseFloat(laborHours),
        unitPrice: parseFloat(laborRate),
        lineTotal: parseFloat(laborHours) * parseFloat(laborRate),
      };
    }

    addItemMutation.mutate(itemData);
  };

  const totalAmount = (billableItems as any[]).reduce((sum: number, item: any) => sum + parseFloat(item.lineTotal || 0), 0);
  const unbilledItems = (billableItems as any[]).filter((item: any) => !item.invoiceId);
  const canGenerateInvoice = unbilledItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Add Item Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Billable Items</h3>
        <div className="flex space-x-2">
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Billable Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemType">Item Type</Label>
                  <Select value={itemType} onValueChange={(value: 'part' | 'labor') => setItemType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="part">Part/Product</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {itemType === 'part' ? (
                  <>
                    <div>
                      <Label htmlFor="part">Select Part</Label>
                      <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a part..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(parts as any[]).map((part: any) => (
                            <SelectItem key={part.id} value={part.id.toString()}>
                              {part.name} - ${part.price} (Stock: {part.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        step="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customPrice">Custom Price (optional)</Label>
                      <Input
                        id="customPrice"
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="Leave empty to use part price"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="description">Labor Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the work performed..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="laborHours">Hours</Label>
                      <Input
                        id="laborHours"
                        type="number"
                        value={laborHours}
                        onChange={(e) => setLaborHours(e.target.value)}
                        min="0"
                        step="0.25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="laborRate">Rate per Hour ($)</Label>
                      <Input
                        id="laborRate"
                        type="number"
                        value={laborRate}
                        onChange={(e) => setLaborRate(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                    Add Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {canGenerateInvoice && (
            <Button 
              variant="outline" 
              onClick={() => generateInvoiceMutation.mutate()}
              disabled={generateInvoiceMutation.isPending}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Billable Items List */}
      {loadingItems ? (
        <div className="text-center py-8">Loading billable items...</div>
      ) : (billableItems as any[]).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No billable items added yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Add parts or labor charges to generate an invoice for this repair
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(billableItems as any[]).map((item: any) => (
            <Card key={item.id} className={item.invoiceId ? 'bg-green-50 border-green-200' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={item.itemType === 'part' ? 'default' : 'secondary'}>
                        {item.itemType === 'part' ? 'Part' : 'Labor'}
                      </Badge>
                      {item.invoiceId && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Invoiced
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium">{item.description}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      Quantity: {item.quantity} × ${item.unitPrice} = ${item.lineTotal}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Added {format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">${parseFloat(item.lineTotal).toFixed(2)}</span>
                    {!item.invoiceId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Total */}
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              {unbilledItems.length > 0 && (
                <div className="text-sm text-gray-600 mt-2">
                  {unbilledItems.length} unbilled item{unbilledItems.length !== 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}