import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PlusCircle, MinusCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface BundleItem {
  id?: number;
  productId: number;
  quantity: number;
  productName?: string;
  price?: number;
}

interface Bundle {
  id?: number;
  name: string;
  description: string | null;
  totalCost: number;
  items: BundleItem[];
}

interface BundleDialogProps {
  onBundleSelected: (bundleId: number) => void;
  trigger?: React.ReactNode;
}

export function BundleDialog({ onBundleSelected, trigger }: BundleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const { toast } = useToast();

  // Fetch all bundles
  const { data: bundles = [] } = useQuery({
    queryKey: ['/api/bundles'],
    enabled: open,
  });

  // Fetch all products for adding to bundles
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: open || isCreating,
  });

  // Create bundle mutation
  const createBundleMutation = useMutation({
    mutationFn: async (bundle: Bundle) => {
      return apiRequest("POST", '/api/bundles', bundle);
    },
    onSuccess: () => {
      toast({
        title: "Bundle created",
        description: "The product bundle was created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bundles'] });
      setIsCreating(false);
      resetBundleForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create bundle: " + error,
        variant: "destructive",
      });
    },
  });

  // Calculate total cost of bundle items
  const calculateTotalCost = (items: BundleItem[]): number => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  // Reset bundle form
  const resetBundleForm = () => {
    setBundleName("");
    setBundleDescription("");
    setBundleItems([]);
    setSelectedProductId("");
    setItemQuantity(1);
  };

  // Handle adding an item to the bundle
  const handleAddItem = () => {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItem: BundleItem = {
      productId: product.id,
      quantity: itemQuantity,
      productName: product.name,
      price: product.price
    };

    setBundleItems([...bundleItems, newItem]);
    setSelectedProductId("");
    setItemQuantity(1);
  };

  // Handle removing an item from the bundle
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...bundleItems];
    updatedItems.splice(index, 1);
    setBundleItems(updatedItems);
  };

  // Handle form submission
  const handleCreateBundle = () => {
    if (!bundleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bundle name",
        variant: "destructive",
      });
      return;
    }

    if (bundleItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the bundle",
        variant: "destructive",
      });
      return;
    }

    const bundle: Bundle = {
      name: bundleName,
      description: bundleDescription || null,
      totalCost: calculateTotalCost(bundleItems),
      items: bundleItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    createBundleMutation.mutate(bundle);
  };

  // Handle bundle selection
  const handleSelectBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    if (bundle.id) {
      onBundleSelected(bundle.id);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Bundle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        {!isCreating ? (
          <>
            <DialogHeader>
              <DialogTitle>Select Product Bundle</DialogTitle>
              <DialogDescription>
                Choose an existing bundle or create a new one.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {bundles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bundle Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundles.map((bundle: Bundle) => (
                      <TableRow key={bundle.id}>
                        <TableCell>{bundle.name}</TableCell>
                        <TableCell>{bundle.description || '-'}</TableCell>
                        <TableCell>{formatCurrency(bundle.totalCost)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleSelectBundle(bundle)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No bundles found</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsCreating(true)}>
                Create New Bundle
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create New Bundle</DialogTitle>
              <DialogDescription>
                Build a new product bundle by adding products.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bundle Name</Label>
                  <Input
                    id="name"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    placeholder="Enter bundle name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={bundleDescription}
                    onChange={(e) => setBundleDescription(e.target.value)}
                    placeholder="Enter bundle description"
                  />
                </div>
              </div>
              
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-3">Add Products to Bundle</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <div>
                    <Label htmlFor="product">Product</Label>
                    <Select
                      value={selectedProductId ? String(selectedProductId) : ""}
                      onValueChange={(value) => setSelectedProductId(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={String(product.id)}>
                            {product.name} ({formatCurrency(product.price)})
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
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleAddItem} type="button" className="gap-1">
                      <PlusCircle className="h-4 w-4" /> Add Item
                    </Button>
                  </div>
                </div>
                
                {bundleItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundleItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price || 0)}</TableCell>
                          <TableCell>{formatCurrency((item.price || 0) * item.quantity)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <MinusCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total Bundle Cost:
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(calculateTotalCost(bundleItems))}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 border-t">
                    <p className="text-muted-foreground">No items added to bundle</p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreating(false);
                  resetBundleForm();
                }}
              >
                Back to List
              </Button>
              <Button
                onClick={handleCreateBundle}
                disabled={createBundleMutation.isPending}
              >
                {createBundleMutation.isPending ? "Creating..." : "Create Bundle"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}