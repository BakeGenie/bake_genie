import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PlusIcon, Loader2, ImageIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

// Define product type based on database structure
interface Product {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  price: string;
  cost: string | null;
  imageUrl: string | null;
  type: string;
  taxRate: string;
  laborHours: string;
  laborRate: string;
  overhead: string;
  active: boolean;
  servings: number | null;
  sku: string | null;
  createdAt: string;
}

const ProductsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Cake",
    price: "",
    cost: "",
    taxRate: "10",
    laborHours: "0",
    laborRate: "0",
    overhead: "0",
    servings: "1",
    sku: "",
    active: true,
  });

  // Fetch products
  const { data: products = [], refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 0, // Always get fresh data
  });

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox/switch change
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      active: checked
    }));
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (3MB limit)
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 3MB",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "Cake",
      price: "",
      cost: "",
      taxRate: "10",
      laborHours: "0",
      laborRate: "0",
      overhead: "0",
      servings: "1",
      sku: "",
      active: true,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let imageUrl = null;
      
      // Upload image if one is selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload image");
        }
        
        const data = await response.json();
        imageUrl = data.imageUrl;
      }
      
      // Prepare product data
      const productData = {
        ...formData,
        imageUrl,
      };
      
      console.log("Submitting product:", productData);
      
      // Create product
      const createResponse = await apiRequest("POST", "/api/products", productData);
      console.log("Product creation response:", createResponse);
      
      // Refresh product list
      await refetchProducts();
      
      // Clear form
      resetForm();
      
      // Close dialog
      setIsOpen(false);
      
      // Show success message
      toast({
        title: "Product created",
        description: "Product has been created successfully",
      });
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear image
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product for your catalog. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Product Type *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cake">Cake</SelectItem>
                        <SelectItem value="Cupcakes">Cupcakes</SelectItem>
                        <SelectItem value="Cookies">Cookies</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    rows={3} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={formData.price} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost</Label>
                    <Input 
                      id="cost" 
                      name="cost" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={formData.cost} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input 
                      id="taxRate" 
                      name="taxRate" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={formData.taxRate} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="servings">Servings</Label>
                    <Input 
                      id="servings" 
                      name="servings" 
                      type="number" 
                      min="1" 
                      value={formData.servings} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input 
                      id="sku" 
                      name="sku" 
                      value={formData.sku} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="laborHours">Labor Hours</Label>
                    <Input 
                      id="laborHours" 
                      name="laborHours" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={formData.laborHours} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="laborRate">Labor Rate</Label>
                    <Input 
                      id="laborRate" 
                      name="laborRate" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={formData.laborRate} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="overhead">Overhead</Label>
                    <Input 
                      id="overhead" 
                      name="overhead" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={formData.overhead} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  {imagePreview ? (
                    <div className="relative w-full h-40">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain" 
                      />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2" 
                        onClick={clearImage}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <label 
                        htmlFor="image" 
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">
                          Click to upload (Max: 3MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active" 
                    checked={formData.active} 
                    onCheckedChange={handleSwitchChange} 
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="h-48 bg-gray-100 relative">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-contain" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-gray-300" />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-md text-xs">
                {product.type}
              </div>
            </div>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>
                {product.description?.substring(0, 100) || "No description"}
                {(product.description?.length || 0) > 100 ? "..." : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <span className="font-bold text-lg">${product.price}</span>
                {product.cost && (
                  <span className="text-gray-500">Cost: ${product.cost}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                <div>Tax Rate: {product.taxRate}%</div>
                <div>Servings: {product.servings || "N/A"}</div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${product.active ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-xs">{product.active ? "Active" : "Inactive"}</span>
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No products found. Add your first product to get started.
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <Link href="/products">
          <Button variant="outline">
            Back to Products Page
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProductsPage;