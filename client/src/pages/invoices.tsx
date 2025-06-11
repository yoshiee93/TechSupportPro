import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Receipt, Search, Eye } from 'lucide-react';

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/invoices'],
  });

  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = !searchQuery || 
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-600">Manage repair invoices and billing</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">Loading invoices...</div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Invoices Found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "all" 
                ? "No invoices match your current filters." 
                : "Generate invoices from ticket billing to see them here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice: any) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Client:</span>
                        <p>{invoice.clientName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Ticket:</span>
                        <p>{invoice.ticketNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium">Generated:</span>
                        <p>{format(new Date(invoice.generatedAt), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span>
                        <p className="font-semibold text-lg">${invoice.totalAmount}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Invoice Details</DialogTitle>
                          <DialogDescription>
                            View complete invoice information and line items.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedInvoice && (
                          <div className="space-y-6">
                            <div className="border-b pb-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h2 className="text-2xl font-bold">{selectedInvoice.invoiceNumber}</h2>
                                  <p className="text-gray-600">Ticket: {selectedInvoice.ticketNumber}</p>
                                </div>
                                <div className="text-right">
                                  <div className="mb-2">
                                    <Badge className={getStatusColor(selectedInvoice.status)}>
                                      {selectedInvoice.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Generated: {format(new Date(selectedInvoice.generatedAt), "MMM d, yyyy")}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Bill To:</h3>
                              <p className="font-medium">{selectedInvoice.clientName}</p>
                              {selectedInvoice.clientEmail && (
                                <p className="text-sm text-gray-600">{selectedInvoice.clientEmail}</p>
                              )}
                            </div>

                            <div>
                              <h3 className="font-semibold mb-3">Items:</h3>
                              <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="text-left p-3 font-medium">Description</th>
                                      <th className="text-right p-3 font-medium">Qty</th>
                                      <th className="text-right p-3 font-medium">Rate</th>
                                      <th className="text-right p-3 font-medium">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedInvoice.items?.map((item: any, index: number) => (
                                      <tr key={index} className="border-t">
                                        <td className="p-3">{item.description}</td>
                                        <td className="p-3 text-right">{item.quantity}</td>
                                        <td className="p-3 text-right">${item.unitPrice}</td>
                                        <td className="p-3 text-right">${item.lineTotal}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <div className="space-y-2 max-w-xs ml-auto">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>${selectedInvoice.subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tax (10%):</span>
                                  <span>${selectedInvoice.taxAmount}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                  <span>Total:</span>
                                  <span>${selectedInvoice.totalAmount}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}