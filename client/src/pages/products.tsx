import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProductSchema } from "@shared/schema";
import { 
  PlusIcon, 
  SearchIcon, 
  DollarSignIcon, 
  PercentIcon, 
  CakeIcon, 
  CookieIcon, 
  LucideIcon, 
  CupSodaIcon, 
  PackageIcon,
  X,
  Upload
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ProductFormData } from "@/types";

// Extended schema with validation rules
const productFormSchema = insertProductSchema.extend({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  imageUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Map product types to icons
const productTypeIcons: Record<string, LucideIcon> = {
  "Cake": CakeIcon,
  "Cupcakes": CupSodaIcon,
  "Cookies": CookieIcon,
  "Other": PackageIcon,
};

const Products = () => {
  const { toast } = useToast();
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = React.useState(false);
  const [isViewProductDialogOpen, setIsViewProductDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<string | null>(null);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Product form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      userId: 1, // In a real app, this would be the current user's ID
      type: "Cake",
      name: "",
      description: "",
      servings: 1,
      price: 0,
      cost: 0,
      taxRate: 0,
      laborHours: 0,
      laborRate: 30, // Default labor rate
      overhead: 0,
      active: true,
    },
  });

  // Calculate profit based on form values
  const calculateProfit = () => {
    const values = form.getValues();
    const cost = Number(values.cost) || 0;
    const laborCost = (Number(values.laborHours) || 0) * (Number(values.laborRate) || 0);
    const overhead = Number(values.overhead) || 0;
    const totalCost = cost + laborCost + overhead;
    const price = Number(values.price) || 0;
    const profit = price - totalCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    
    return {
      cost: totalCost.toFixed(2),
      profit: profit.toFixed(2),
      margin: margin.toFixed(2),
    };
  };

  // Calculate cost per serving
  const calculateCostPerServing = () => {
    const values = form.getValues();
    const totalCost = Number(calculateProfit().cost);
    const servings = Number(values.servings) || 1;
    return (totalCost / servings).toFixed(2);
  };

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Set the imageUrl field in the form
      form.setValue("imageUrl", URL.createObjectURL(file));
    }
  };
  
  // Handle image upload
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Handle new product submission
  const handleNewProductSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      // If there's an image file, upload it first
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile);
        data.imageUrl = imageUrl;
      }
      
      await apiRequest("POST", "/api/products", data);
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Reset form and close dialog
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      setIsNewProductDialogOpen(false);
      
      toast({
        title: "Product Created",
        description: `${data.name} has been added to your products.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating the product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by search term and type
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = !filterType || product.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get unique product types for filtering
  const productTypes = Array.from(new Set(products.map(product => product.type)));

  // Handle product selection for viewing
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsViewProductDialogOpen(true);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Products"
        actions={
          <Button onClick={() => setIsNewProductDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" /> New Product
          </Button>
        }
      />

      <div className="mt-6 flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterType || "all"}
          onValueChange={(value) => setFilterType(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {productTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const Icon = productTypeIcons[product.type] || PackageIcon;
            return (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleProductClick(product)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center">
                      <Icon className="h-5 w-5 mr-2 text-primary-500" />
                      {product.name}
                    </CardTitle>
                    <Badge variant={product.active ? "default" : "outline"}>
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{product.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  {product.imageUrl && (
                    <div className="mb-3 h-32 flex items-center justify-center">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="max-h-32 max-w-full object-contain"
                      />
                    </div>
                  )}
                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                  )}
                  {product.servings && (
                    <p className="text-sm">Servings: {product.servings}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex items-center">
                    <DollarSignIcon className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="font-medium">${Number(product.price).toFixed(2)}</span>
                  </div>
                  {product.cost && product.price && (
                    <div className="flex items-center">
                      <PercentIcon className="h-4 w-4 mr-1 text-gray-500" />
                      <span>
                        {Math.round(((Number(product.price) - Number(product.cost)) / Number(product.price)) * 100)}% margin
                      </span>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="mt-8">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <CakeIcon className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {search || filterType
                ? "No products match your search criteria. Try a different search term or filter."
                : "You haven't created any products yet. Create your first product to get started."}
            </p>
            <Button onClick={() => setIsNewProductDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" /> New Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Product Dialog */}
      <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Product</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNewProductSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Overview Card */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Product Overview</h3>
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            {field.value === "custom" ? (
                              <FormControl>
                                <Input 
                                  placeholder="Enter custom type" 
                                  value={field.value === "custom" ? "" : field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </FormControl>
                            ) : (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Cake">Cake</SelectItem>
                                  <SelectItem value="Cupcakes">Cupcakes</SelectItem>
                                  <SelectItem value="Cookies">Cookies</SelectItem>
                                  <SelectItem value="custom">Add custom type...</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          {field.value === "custom" && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => field.onChange("Cake")}
                              className="flex-none"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Vanilla Buttercream Cake" {...field} />
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
                        <FormLabel>Product Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A delicious vanilla cake with buttercream frosting..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Image Upload Field */}
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className="flex flex-col items-center space-y-2">
                      {imagePreview ? (
                        <div className="relative w-full h-40 mb-2">
                          <img 
                            src={imagePreview} 
                            alt="Product preview" 
                            className="w-full h-full object-contain border rounded-md"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                              form.setValue("imageUrl", "");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-md w-full h-40 flex items-center justify-center cursor-pointer hover:border-primary-500"
                          onClick={() => document.getElementById('product-image-upload')?.click()}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <p className="text-sm text-gray-500">Click to upload an image</p>
                            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 3MB</p>
                          </div>
                        </div>
                      )}
                      <input
                        id="product-image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                  </FormItem>
                  
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Product</FormLabel>
                          <p className="text-sm text-gray-500">
                            Inactive products won't appear in order forms
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  

                </div>
                
                {/* Details Card */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of Servings</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value ? parseInt(e.target.value) : "");
                              form.trigger("price");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="laborHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Labor Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : "");
                                form.trigger("price");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="laborRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Labor Rate ($/h)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : "");
                                form.trigger("price");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost of Ingredients ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value ? parseFloat(e.target.value) : "");
                              form.trigger("price");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="overhead"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overhead Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value ? parseFloat(e.target.value) : "");
                              form.trigger("price");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-500">Calculated Cost:</div>
                      <div className="font-medium">${calculateProfit().cost}</div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-500">Cost per Serving:</div>
                      <div className="font-medium">${calculateCostPerServing()}</div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : "");
                                form.trigger("price");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : "");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-gray-600 font-medium">Profit:</div>
                        <div className="text-lg font-medium text-green-600">${calculateProfit().profit}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-gray-600 font-medium">Profit Margin:</div>
                        <div className="text-lg font-medium text-green-600">{calculateProfit().margin}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewProductDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      {selectedProduct && (
        <Dialog open={isViewProductDialogOpen} onOpenChange={setIsViewProductDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p>{selectedProduct.type}</p>
                </div>
                <Badge variant={selectedProduct.active ? "default" : "outline"}>
                  {selectedProduct.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              {selectedProduct.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="text-gray-700">{selectedProduct.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {selectedProduct.servings && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Servings</h3>
                    <p>{selectedProduct.servings}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p className="text-lg font-medium">${Number(selectedProduct.price).toFixed(2)}</p>
                </div>
              </div>
              
              {selectedProduct.cost && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Cost</h3>
                    <p>${Number(selectedProduct.cost).toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Profit</h3>
                    <p className="text-green-600 font-medium">
                      ${(Number(selectedProduct.price) - Number(selectedProduct.cost)).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              
              {(selectedProduct.laborHours || selectedProduct.laborRate) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedProduct.laborHours && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Labor Hours</h3>
                      <p>{selectedProduct.laborHours}</p>
                    </div>
                  )}
                  
                  {selectedProduct.laborRate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Labor Rate</h3>
                      <p>${Number(selectedProduct.laborRate).toFixed(2)}/hr</p>
                    </div>
                  )}
                </div>
              )}
              
              {selectedProduct.taxRate !== null && selectedProduct.taxRate !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tax Rate</h3>
                  <p>{Number(selectedProduct.taxRate).toFixed(2)}%</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewProductDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewProductDialogOpen(false);
                  toast({
                    title: "Edit Product",
                    description: "Product editing will be implemented soon.",
                  });
                }}
              >
                Edit Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Products;
