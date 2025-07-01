import { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertPartSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MobileBarcodeScanner from "./mobile-barcode-scanner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Scan } from "lucide-react";

const formSchema = insertPartSchema.extend({
  categoryId: z.number().optional(),
  supplierId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PartFormProps {
  onSuccess?: () => void;
  initialData?: Partial<FormValues>;
}

export default function PartForm({ onSuccess, initialData }: PartFormProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/inventory/suppliers"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/inventory/categories"],
  });

  const defaultValues = {
    sku: "",
    name: "",
    description: "",
    categoryId: undefined,
    supplierId: undefined,
    supplierPartNumber: "",
    manufacturer: "",
    manufacturerPartNumber: "",
    unitCost: "0.00",
    sellingPrice: "0.00",
    markup: "0.00",
    quantityOnHand: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    maxStockLevel: undefined,
    location: "",
    weight: undefined,
    dimensions: "",
    warrantyPeriod: undefined,
    isActive: true,
    isStocked: true,
    ...initialData,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Reset form when initialData changes (e.g., when barcode is scanned)
  useEffect(() => {
    if (initialData) {
      console.log('PartForm: Initial data changed:', initialData);
      const newValues = {
        sku: "",
        name: "",
        description: "",
        categoryId: undefined,
        supplierId: undefined,
        supplierPartNumber: "",
        manufacturer: "",
        manufacturerPartNumber: "",
        unitCost: "0.00",
        sellingPrice: "0.00",
        markup: "0.00",
        quantityOnHand: 0,
        reorderPoint: 0,
        reorderQuantity: 0,
        maxStockLevel: undefined,
        location: "",
        weight: undefined,
        dimensions: "",
        warrantyPeriod: undefined,
        isActive: true,
        isStocked: true,
        ...initialData,
      };
      console.log('PartForm: Resetting form with values:', newValues);
      form.reset(newValues);
    }
  }, [initialData, form]);

  const createPartMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("/api/inventory/parts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/parts"] });
      toast({
        title: "Success",
        description: "Part created successfully",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create part",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createPartMutation.mutate(data);
  };

  const handleBarcodeScanned = (barcode: string) => {
    form.setValue("sku", barcode);
    setScannerOpen(false);
    toast({
      title: "Barcode Scanned",
      description: `SKU set to: ${barcode}`,
    });
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>SKU / Barcode *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter SKU or scan barcode"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setScannerOpen(true)}
                className="h-10 w-10"
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., iPhone 12 Screen Assembly"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Part description"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(categories) &&
                        categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
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
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(suppliers) &&
                        suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Samsung, Apple"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturerPartNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer Part #</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Manufacturer's part number"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="unitCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="markup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Markup %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="quantityOnHand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity on Hand</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reorderPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Point</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reorderQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Shelf A-1, Bin 23"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Is this part currently active?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isStocked"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Stocked Item</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Do we keep this part in stock?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createPartMutation.isPending}>
              {createPartMutation.isPending ? "Creating..." : "Create Part"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
          </div>
        </form>
      </Form>

      <MobileBarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </div>
  );
}