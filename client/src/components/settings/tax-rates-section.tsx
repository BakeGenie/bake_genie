import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, PencilIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FormatCurrency } from "@/components/ui/format-currency";
import { useSettings } from "@/contexts/settings-context";

// Tax rate schema
const taxRateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rate: z.string().min(1, "Rate is required").or(z.number()),
  description: z.string().optional(),
  isDefault: z.boolean().default(false)
});

type TaxRateFormValues = z.infer<typeof taxRateSchema>;

type TaxRate = {
  id: number;
  userId: number;
  name: string;
  rate: number;
  description: string | null;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export function TaxRatesSection() {
  const { settings, updateSettings } = useSettings();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTaxRate, setCurrentTaxRate] = useState<TaxRate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tax rates
  const { data: taxRates = [] } = useQuery({
    queryKey: ['/api/tax-rates'],
    select: (data) => data as TaxRate[]
  });

  // Form for adding a new tax rate
  const form = useForm<TaxRateFormValues>({
    resolver: zodResolver(taxRateSchema),
    defaultValues: {
      name: "",
      rate: "",
      description: "",
      isDefault: false
    }
  });

  // Form for editing a tax rate
  const editForm = useForm<TaxRateFormValues>({
    resolver: zodResolver(taxRateSchema),
    defaultValues: {
      name: "",
      rate: "",
      description: "",
      isDefault: false
    }
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      form.reset();
    }
  }, [isAddDialogOpen, form]);

  // Set form values when editing
  useEffect(() => {
    if (currentTaxRate && isEditDialogOpen) {
      editForm.reset({
        name: currentTaxRate.name,
        rate: currentTaxRate.rate.toString(),
        description: currentTaxRate.description || "",
        isDefault: currentTaxRate.isDefault
      });
    }
  }, [currentTaxRate, isEditDialogOpen, editForm]);

  // Mutation for creating a tax rate
  const createTaxRate = useMutation({
    mutationFn: (data: TaxRateFormValues) => {
      return apiRequest("/api/tax-rates", {
        method: "POST",
        data: {
          ...data,
          // Convert rate from string to number
          rate: parseFloat(data.rate as string)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax-rates'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Tax rate has been created",
      });
    },
    onError: (error) => {
      console.error("Error creating tax rate:", error);
      toast({
        title: "Error",
        description: "Failed to create tax rate",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating a tax rate
  const updateTaxRate = useMutation({
    mutationFn: (data: TaxRateFormValues & { id: number }) => {
      return apiRequest(`/api/tax-rates/${data.id}`, {
        method: "PUT",
        data: {
          name: data.name,
          rate: parseFloat(data.rate as string),
          description: data.description,
          isDefault: data.isDefault
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax-rates'] });
      setIsEditDialogOpen(false);
      setCurrentTaxRate(null);
      toast({
        title: "Success",
        description: "Tax rate has been updated",
      });
    },
    onError: (error) => {
      console.error("Error updating tax rate:", error);
      toast({
        title: "Error",
        description: "Failed to update tax rate",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting a tax rate
  const deleteTaxRate = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/tax-rates/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax-rates'] });
      toast({
        title: "Success",
        description: "Tax rate has been deleted",
      });
    },
    onError: (error) => {
      console.error("Error deleting tax rate:", error);
      toast({
        title: "Error",
        description: "Failed to delete tax rate",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating settings
  const updateTaxSettings = useMutation({
    mutationFn: (data: { 
      taxEnabled: boolean; 
      useGst: boolean; 
      useTaxInvoice: boolean;
    }) => {
      return apiRequest("/api/settings", {
        method: "PATCH",
        data
      });
    },
    onSuccess: (data) => {
      updateSettings(data);
      toast({
        title: "Success",
        description: "Tax settings have been updated",
      });
    },
    onError: (error) => {
      console.error("Error updating tax settings:", error);
      toast({
        title: "Error",
        description: "Failed to update tax settings",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: TaxRateFormValues) => {
    createTaxRate.mutate(data);
  };

  const handleEdit = (data: TaxRateFormValues) => {
    if (!currentTaxRate) return;
    updateTaxRate.mutate({ ...data, id: currentTaxRate.id });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this tax rate?")) {
      deleteTaxRate.mutate(id);
    }
  };

  const handleTaxEnabledChange = (checked: boolean) => {
    updateTaxSettings.mutate({
      taxEnabled: checked,
      useGst: settings?.useGst || false,
      useTaxInvoice: settings?.useTaxInvoice || false
    });
  };

  const handleUseGstChange = (checked: boolean) => {
    updateTaxSettings.mutate({
      taxEnabled: settings?.taxEnabled || true,
      useGst: checked,
      useTaxInvoice: settings?.useTaxInvoice || false
    });
  };

  const handleUseTaxInvoiceChange = (checked: boolean) => {
    updateTaxSettings.mutate({
      taxEnabled: settings?.taxEnabled || true,
      useGst: settings?.useGst || false,
      useTaxInvoice: checked
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Tax Rates</CardTitle>
        <CardDescription>Manage tax rates for your bakery products and services</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="taxEnabled" 
                  checked={settings?.taxEnabled} 
                  onCheckedChange={handleTaxEnabledChange}
                />
                <label
                  htmlFor="taxEnabled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tax Applicable
                </label>
              </div>
              <p className="text-sm text-muted-foreground">Uncheck this box if you are not registered to charge tax.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useTaxInvoice" 
                  checked={settings?.useTaxInvoice} 
                  onCheckedChange={handleUseTaxInvoiceChange}
                />
                <label
                  htmlFor="useTaxInvoice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use "Tax Invoice" as title for all invoices
                </label>
              </div>
              <p className="text-sm text-muted-foreground">Check this box if you would like the header on your invoices to read as "Tax Invoice" instead of "Invoice". (This is optional and is dependent on your local legislation)</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useGst" 
                  checked={settings?.useGst} 
                  onCheckedChange={handleUseGstChange}
                />
                <label
                  htmlFor="useGst"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use GST instead of VAT
                </label>
              </div>
              <p className="text-sm text-muted-foreground">Check this box to switch to GST (Goods and Services Tax) instead of VAT (Value Added Tax).</p>
            </div>
          </div>

          <div className="py-4">
            <h3 className="text-lg font-medium">Current Rates</h3>
            {taxRates.length > 0 ? (
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxRates.map((taxRate) => (
                    <TableRow key={taxRate.id}>
                      <TableCell>{taxRate.name}</TableCell>
                      <TableCell>{taxRate.rate}%</TableCell>
                      <TableCell>{taxRate.description}</TableCell>
                      <TableCell>
                        {taxRate.isDefault && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentTaxRate(taxRate);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(taxRate.id)}
                            disabled={taxRate.isDefault}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 text-center bg-muted rounded-md mt-2">
                <p>No tax rates have been added yet.</p>
              </div>
            )}
            
            <div className="mt-4">
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Tax Rate
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Add Tax Rate Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tax Rate</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Standard Rate" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="20"
                        {...field}
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Standard tax rate for most products and services"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as default tax rate
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This rate will be automatically applied to new products.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaxRate.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Tax Rate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tax Rate</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as default tax rate
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This rate will be automatically applied to new products.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTaxRate.isPending}>
                  Update
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}