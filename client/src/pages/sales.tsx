import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import MobileBarcodeScanner from '@/components/inventory/mobile-barcode-scanner';
import { ShoppingCart, Scan, Plus, Trash2, Package, AlertTriangle } from 'lucide-react';

const saleItemSchema = z.object({
  partId: z.number().nullable(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unitPrice: z.string().min(1, 'Unit price is required'),
  taxRate: z.string().default('10.00'),
  taxInclusive: z.boolean().default(false),
  lineTotal: z.string().optional(),
});

const salesTransactionSchema = z.object({
  clientId: z.number({ required_error: 'Please select a client' }),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
});

type SaleItemFormData = z.infer<typeof saleItemSchema>;
type SalesTransactionFormData = z.infer<typeof salesTransactionSchema>;

export default function SalesPage() {
  const [saleItems, setSaleItems] = useState<SaleItemFormData[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  // Fetch parts for inventory lookup
  const { data: parts = [] } = useQuery<any[]>({
    queryKey: ['/api/inventory/parts'],
  });

  const form = useForm<SalesTransactionFormData>({
    resolver: zodResolver(salesTransactionSchema),
    defaultValues: {
      items: [],
      notes: '',
    },
  });

  const itemForm = useForm<SaleItemFormData>({
    resolver: zodResolver(saleItemSchema),
    defaultValues: {
      partId: null,
      description: '',
      quantity: '1',
      unitPrice: '0.00',
      taxRate: '10.00',
      taxInclusive: false,
    },
  });

  // Create sales transaction mutation
  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/sales', data);
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log('Sale success response:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/parts'] });
      
      const transactionId = data?.transaction?.id || 'Unknown';
      const totalAmount = data?.transaction?.totalAmount || '0.00';
      
      toast({
        title: "Sale Completed Successfully!",
        description: `Transaction #${transactionId} created. Total: $${totalAmount}`,
      });
      
      // Reset form and items
      form.reset();
      setSaleItems([]);
      setEditingItemIndex(null);
    },
    onError: (error: any) => {
      console.error('Sale error:', error);
      toast({
        title: "Error",
        description: "Failed to complete sale",
        variant: "destructive",
      });
    }
  });

  const handleBarcodeScanned = (barcode: string) => {
    const part = parts.find((p: any) => p.sku === barcode);
    
    if (part) {
      itemForm.setValue('partId', part.id);
      itemForm.setValue('description', part.name);
      itemForm.setValue('unitPrice', part.sellingPrice || part.unitCost || '0.00');
      
      // Show stock level warning
      if (part.quantityOnHand <= 0) {
        toast({
          title: "Out of Stock",
          description: `${part.name} is currently out of stock`,
          variant: "destructive",
        });
      } else if (part.quantityOnHand < 5) {
        toast({
          title: "Low Stock Warning",
          description: `Only ${part.quantityOnHand} units remaining`,
        });
      }
    } else {
      // Product not found in inventory, allow manual entry
      itemForm.setValue('partId', null);
      itemForm.setValue('description', `Product: ${barcode}`);
      toast({
        title: "Product Not Found",
        description: "Product not in inventory. You can still proceed with manual entry.",
      });
    }
    
    setIsScannerOpen(false);
  };

  const addSaleItem = (data: SaleItemFormData) => {
    const quantity = parseFloat(data.quantity);
    const unitPrice = parseFloat(data.unitPrice);
    const taxRate = parseFloat(data.taxRate);
    
    let lineTotal;
    if (data.taxInclusive) {
      lineTotal = unitPrice * quantity;
    } else {
      lineTotal = (unitPrice * quantity) * (1 + taxRate / 100);
    }

    const newItem = {
      ...data,
      lineTotal: lineTotal.toFixed(2),
    };

    let updatedItems;
    if (editingItemIndex !== null) {
      updatedItems = [...saleItems];
      updatedItems[editingItemIndex] = newItem;
      setSaleItems(updatedItems);
      setEditingItemIndex(null);
    } else {
      updatedItems = [...saleItems, newItem];
      setSaleItems(updatedItems);
    }

    // Update the form's items field
    form.setValue('items', updatedItems);
    itemForm.reset();
  };

  const editSaleItem = (index: number) => {
    const item = saleItems[index];
    itemForm.reset(item);
    setEditingItemIndex(index);
  };

  const removeSaleItem = (index: number) => {
    const updatedItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(updatedItems);
    form.setValue('items', updatedItems);
    
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      itemForm.reset();
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    saleItems.forEach(item => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const taxRate = parseFloat(item.taxRate);

      if (item.taxInclusive) {
        const itemTotal = unitPrice * quantity;
        const taxAmount = itemTotal - (itemTotal / (1 + taxRate / 100));
        subtotal += itemTotal - taxAmount;
        totalTax += taxAmount;
      } else {
        const itemSubtotal = unitPrice * quantity;
        const taxAmount = itemSubtotal * (taxRate / 100);
        subtotal += itemSubtotal;
        totalTax += taxAmount;
      }
    });

    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: totalTax.toFixed(2),
      total: (subtotal + totalTax).toFixed(2),
    };
  };

  const handleCompleteSale = (formData: SalesTransactionFormData) => {    
    if (saleItems.length === 0) {
      toast({
        title: "No items",
        description: "Please add at least one item to the sale",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();
    
    const transactionData = {
      transaction: {
        clientId: formData.clientId,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.total,
        notes: formData.notes,
      },
      items: saleItems.map(item => ({
        partId: item.partId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxInclusive: item.taxInclusive,
        lineTotal: item.lineTotal,
      })),
    };

    // Show immediate feedback
    toast({
      title: "Processing Sale...",
      description: "Creating transaction, please wait",
    });

    createSaleMutation.mutate(transactionData);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Entry</h1>
          <p className="text-muted-foreground">
            Create new sales transactions and manage product sales
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sale Items Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Add Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...itemForm}>
              <form onSubmit={itemForm.handleSubmit(addSaleItem)} className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Scan className="w-4 h-4" />
                    Scan Barcode
                  </Button>
                </div>

                <FormField
                  control={itemForm.control}
                  name="partId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Product</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const partId = value === "manual" ? null : parseInt(value);
                          field.onChange(partId);
                          
                          if (partId) {
                            const part = parts.find((p: any) => p.id === partId);
                            if (part) {
                              itemForm.setValue('description', part.name);
                              itemForm.setValue('unitPrice', part.sellingPrice || part.unitCost || '0.00');
                            }
                          } else if (value === "manual") {
                            // Clear fields for manual entry
                            itemForm.setValue('description', '');
                            itemForm.setValue('unitPrice', '0.00');
                          }
                        }}
                        value={field.value ? field.value.toString() : 'manual'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a product or scan barcode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                          {parts.map((part: any) => (
                            <SelectItem key={part.id} value={part.id.toString()}>
                              {part.name} - ${part.sellingPrice || part.unitCost || '0.00'}
                              {part.quantityOnHand <= 0 && ' (Out of Stock)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={itemForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Item description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={itemForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={itemForm.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="10.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="taxInclusive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Tax Inclusive</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sale Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Sale Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCompleteSale)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Sale notes..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Items List */}
                <div className="space-y-2">
                  <h4 className="font-medium">Items ({saleItems.length})</h4>
                  {saleItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No items added</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {saleItems.map((item, index) => {
                        const part = item.partId ? parts.find((p: any) => p.id === item.partId) : null;
                        const hasLowStock = part && part.quantityOnHand < 5;
                        const isOutOfStock = part && part.quantityOnHand <= 0;
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{item.description}</div>
                                {part && (
                                  <div className="flex items-center gap-1">
                                    {isOutOfStock ? (
                                      <Badge variant="destructive" className="text-xs">
                                        Out of Stock
                                      </Badge>
                                    ) : hasLowStock ? (
                                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Low Stock
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        In Stock: {part.quantityInStock}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.quantity} × ${item.unitPrice} 
                                {item.taxInclusive ? ' (tax inc.)' : ` + ${item.taxRate}% tax`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">${item.lineTotal}</div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => editSaleItem(index)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSaleItem(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Totals */}
                {saleItems.length > 0 && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${totals.taxAmount}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${totals.total}</span>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={saleItems.length === 0 || createSaleMutation.isPending}

                >
                  Complete Sale
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Product Barcode"
      />
    </div>
  );
}