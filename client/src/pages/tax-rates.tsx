import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PageHeader from '@/components/ui/page-header';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/settings-context';
import { Loader } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

// Zod schema for tax rate form validation
const taxRateSchema = z.object({
  name: z.string().min(1, "Tax rate name is required"),
  rate: z.string().transform((val) => parseFloat(val)).refine((val) => !isNaN(val) && val >= 0, {
    message: "Rate must be a valid number",
  }),
  isDefault: z.boolean().default(false),
});

type TaxRateFormValues = z.infer<typeof taxRateSchema>;

// Zod schema for tax settings form validation
const taxSettingsSchema = z.object({
  taxEnabled: z.boolean(),
  taxTerminology: z.enum(["GST", "VAT", "Tax"]),
  taxInvoiceTitle: z.string().min(1, "Invoice title is required"),
});

type TaxSettingsFormValues = z.infer<typeof taxSettingsSchema>;

export default function TaxRatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings, updateSettings } = useSettings();
  const [isAddTaxRateOpen, setIsAddTaxRateOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<any | null>(null);

  // Tax rates query
  const { data: taxRates = [], isLoading: taxRatesLoading } = useQuery({
    queryKey: ['/api/tax-rates'],
  });

  // Tax rate form
  const taxRateForm = useForm<TaxRateFormValues>({
    resolver: zodResolver(taxRateSchema),
    defaultValues: {
      name: '',
      rate: '',
      isDefault: false,
    },
  });

  // Tax settings form
  const taxSettingsForm = useForm<TaxSettingsFormValues>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: {
      taxEnabled: settings?.taxEnabled || false,
      taxTerminology: settings?.taxTerminology || 'Tax',
      taxInvoiceTitle: settings?.taxInvoiceTitle || 'Tax Invoice',
    },
  });

  // Update forms when settings change
  useEffect(() => {
    if (settings) {
      taxSettingsForm.reset({
        taxEnabled: settings.taxEnabled || false,
        taxTerminology: settings.taxTerminology || 'Tax',
        taxInvoiceTitle: settings.taxInvoiceTitle || 'Tax Invoice',
      });
    }
  }, [settings, taxSettingsForm]);

  // Reset form when editing different tax rate
  useEffect(() => {
    if (editingTaxRate) {
      taxRateForm.reset({
        name: editingTaxRate.name,
        rate: editingTaxRate.rate.toString(),
        isDefault: editingTaxRate.isDefault,
      });
    } else {
      taxRateForm.reset({
        name: '',
        rate: '',
        isDefault: false,
      });
    }
  }, [editingTaxRate, taxRateForm]);

  // Add/Edit tax rate mutation
  const taxRateMutation = useMutation({
    mutationFn: async (data: TaxRateFormValues) => {
      if (editingTaxRate) {
        return apiRequest(`/api/tax-rates/${editingTaxRate.id}`, {
          method: 'PATCH',
          body: data,
        });
      } else {
        return apiRequest('/api/tax-rates', {
          method: 'POST',
          body: data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax-rates'] });
      toast({
        title: editingTaxRate ? 'Tax rate updated' : 'Tax rate added',
        description: editingTaxRate
          ? `Tax rate "${editingTaxRate.name}" has been updated.`
          : 'New tax rate has been added.',
      });
      taxRateForm.reset();
      setIsAddTaxRateOpen(false);
      setEditingTaxRate(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${editingTaxRate ? 'update' : 'add'} tax rate. ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete tax rate mutation
  const deleteTaxRateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/tax-rates/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax-rates'] });
      toast({
        title: 'Tax rate deleted',
        description: 'The tax rate has been deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete tax rate. ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Tax settings mutation
  const taxSettingsMutation = useMutation({
    mutationFn: async (data: TaxSettingsFormValues) => {
      return apiRequest('/api/settings', {
        method: 'PATCH',
        body: {
          taxEnabled: data.taxEnabled,
          taxTerminology: data.taxTerminology,
          taxInvoiceTitle: data.taxInvoiceTitle,
        },
      });
    },
    onSuccess: (data) => {
      updateSettings(data);
      toast({
        title: 'Tax settings updated',
        description: 'Your tax settings have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update tax settings. ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Submit handlers
  const onTaxRateSubmit = (data: TaxRateFormValues) => {
    taxRateMutation.mutate(data);
  };

  const onTaxSettingsSubmit = (data: TaxSettingsFormValues) => {
    taxSettingsMutation.mutate(data);
  };

  // Handle editing a tax rate
  const handleEditTaxRate = (taxRate: any) => {
    setEditingTaxRate(taxRate);
    setIsAddTaxRateOpen(true);
  };

  // Confirm deletion dialog
  const [taxRateToDelete, setTaxRateToDelete] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteTaxRate = (taxRate: any) => {
    setTaxRateToDelete(taxRate);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTaxRate = () => {
    if (taxRateToDelete) {
      deleteTaxRateMutation.mutate(taxRateToDelete.id);
      setIsDeleteDialogOpen(false);
      setTaxRateToDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <PageHeader title="Tax Rates" />
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
          {/* Tax Settings Card */}
          <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure how tax is handled across your business</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...taxSettingsForm}>
                <form onSubmit={taxSettingsForm.handleSubmit(onTaxSettingsSubmit)} className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="taxEnabled">Enable Tax</Label>
                    <FormField
                      control={taxSettingsForm.control}
                      name="taxEnabled"
                      render={({ field }) => (
                        <Switch
                          id="taxEnabled"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <FormField
                    control={taxSettingsForm.control}
                    name="taxTerminology"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Terminology</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GST">GST</SelectItem>
                            <SelectItem value="VAT">VAT</SelectItem>
                            <SelectItem value="Tax">Tax</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={taxSettingsForm.control}
                    name="taxInvoiceTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Invoice Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Tax Invoice" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={taxSettingsMutation.isPending}
                    >
                      {taxSettingsMutation.isPending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Tax Rates Card */}
          <Card className="lg:col-span-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tax Rates</CardTitle>
                <CardDescription>Manage your tax rates for different products and services</CardDescription>
              </div>
              <Dialog open={isAddTaxRateOpen} onOpenChange={setIsAddTaxRateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTaxRate(null)}>
                    Add Tax Rate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTaxRate ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
                    <DialogDescription>
                      {editingTaxRate
                        ? 'Update the details for this tax rate'
                        : 'Create a new tax rate with a name and percentage'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...taxRateForm}>
                    <form onSubmit={taxRateForm.handleSubmit(onTaxRateSubmit)} className="space-y-4">
                      <FormField
                        control={taxRateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Standard Rate" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={taxRateForm.control}
                        name="rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={taxRateForm.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Default Rate</FormLabel>
                              <FormDescription>
                                Make this the default tax rate for new products
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsAddTaxRateOpen(false);
                            setEditingTaxRate(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={taxRateMutation.isPending}
                        >
                          {taxRateMutation.isPending ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              {editingTaxRate ? 'Updating...' : 'Adding...'}
                            </>
                          ) : (
                            editingTaxRate ? 'Update Tax Rate' : 'Add Tax Rate'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {taxRatesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="h-6 w-6 animate-spin" />
                </div>
              ) : taxRates.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No tax rates found. Add your first tax rate to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {taxRates.map((taxRate: any) => (
                    <div 
                      key={taxRate.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{taxRate.name}</h3>
                        <p className="text-sm text-muted-foreground">{taxRate.rate}%</p>
                        {taxRate.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-1">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTaxRate(taxRate)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteTaxRate(taxRate)}
                          disabled={taxRate.isDefault}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tax Rate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tax rate "{taxRateToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTaxRate}
              disabled={deleteTaxRateMutation.isPending}
            >
              {deleteTaxRateMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}