import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Trash2, 
  Plus,
  FilterIcon,
  Edit,
  X,
  Package
} from "lucide-react";

// Define supply item type
interface SupplyItem {
  id: number;
  name: string;
  supplier?: string;
  category?: string;
  price?: number;
  description?: string;
  quantity?: number;
  reorder_level?: number;
}

// Define form data type for adding/editing supplies
interface SupplyFormData {
  name: string;
  supplier: string;
  category: string;
  price: string;
  description: string;
  quantity: string;
  reorder_level: string;
}

// Define category options
const categoryOptions = ["Boards & Cards", "Packaging", "Decorations", "Tools", "Other"];
const categories = ["All Supplies", ...categoryOptions];

// Mock data for initial supplies (you would fetch this from an API in a real application)
const mockSupplies: SupplyItem[] = [
  { 
    id: 1, 
    name: "Cake boxes 8 inch", 
    supplier: "Box Supplier Inc.", 
    category: "Packaging", 
    price: 2.50,
    quantity: 45,
    reorder_level: 10
  },
  { 
    id: 2, 
    name: "Cake boards 10 inch", 
    supplier: "Cake Craft", 
    category: "Boards & Cards", 
    price: 1.75,
    quantity: 22,
    reorder_level: 8
  },
  { 
    id: 3, 
    name: "Piping tips - set of 12", 
    supplier: "Bake Tools", 
    category: "Tools", 
    price: 14.99,
    quantity: 5,
    reorder_level: 2
  }
];

const SuppliesList = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Supplies");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editItem, setEditItem] = useState<SupplyItem | null>(null);
  
  // Form state for new supply item
  const [formData, setFormData] = useState<SupplyFormData>({
    name: "",
    supplier: "",
    category: "Packaging",
    price: "",
    description: "",
    quantity: "0",
    reorder_level: "5"
  });
  
  // Form state for editing an existing supply item
  const [editFormData, setEditFormData] = useState<SupplyFormData>({
    name: "",
    supplier: "",
    category: "Packaging",
    price: "",
    description: "",
    quantity: "0",
    reorder_level: "5"
  });
  
  // Fetch supplies from the API
  const { 
    data: supplies = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["/api/supplies"],
    queryFn: async () => {
      const response = await fetch('/api/supplies');
      if (!response.ok) {
        throw new Error('Failed to fetch supplies');
      }
      return response.json();
    },
  });
  
  // Filter supplies based on search query and selected category
  const filteredSupplies = supplies.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All Supplies" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle adding a new supply item
  const handleAddSupply = () => {
    // Reset form data
    setFormData({
      name: "",
      supplier: "",
      category: "Packaging",
      price: "",
      description: "",
      quantity: "0",
      reorder_level: "5"
    });
    
    // Open the dialog
    setIsAddDialogOpen(true);
  };
  
  // Handle editing an existing supply item
  const handleEditSupply = (item: SupplyItem) => {
    setEditItem(item);
    setEditFormData({
      name: item.name,
      supplier: item.supplier || "",
      category: item.category || "Packaging",
      price: item.price ? item.price.toString() : "",
      description: item.description || "",
      quantity: item.quantity ? item.quantity.toString() : "0",
      reorder_level: item.reorder_level ? item.reorder_level.toString() : "5"
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle saving a new supply item
  const handleSaveNewSupply = async () => {
    // Validate required fields
    if (!formData.name) {
      toast({
        title: "Missing information",
        description: "Supply name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const supplyData = {
        name: formData.name,
        supplier: formData.supplier || null,
        category: formData.category,
        price: formData.price || null, // Keep price as string for decimal columns
        description: formData.description || null,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        reorder_level: formData.reorder_level ? parseInt(formData.reorder_level) : 5
      };
      
      // Send to API
      const response = await fetch('/api/supplies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplyData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add supply');
      }
      
      // Get the created supply from the response
      const newSupply = await response.json();
      
      // Refresh the supplies list
      queryClient.invalidateQueries({ queryKey: ['/api/supplies'] });
      
      toast({
        title: "Supply added",
        description: `${formData.name} has been added to your supplies list`
      });
      
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding supply:', error);
      toast({
        title: "Error",
        description: "There was a problem adding the supply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle updating an existing supply item
  const handleUpdateSupply = async () => {
    if (!editItem) return;
    
    // Validate required fields
    if (!editFormData.name) {
      toast({
        title: "Missing information",
        description: "Supply name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const supplyData = {
        name: editFormData.name,
        supplier: editFormData.supplier || null,
        category: editFormData.category,
        price: editFormData.price || null, // Keep price as string for decimal columns
        description: editFormData.description || null,
        quantity: editFormData.quantity ? parseInt(editFormData.quantity) : 0,
        reorder_level: editFormData.reorder_level ? parseInt(editFormData.reorder_level) : 5
      };
      
      // Send to API
      const response = await fetch(`/api/supplies/${editItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplyData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update supply');
      }
      
      // Get the updated supply from the response
      const updatedSupply = await response.json();
      
      // Refresh the supplies list
      queryClient.invalidateQueries({ queryKey: ['/api/supplies'] });
      
      toast({
        title: "Supply updated",
        description: `${editFormData.name} has been updated successfully`
      });
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating supply:', error);
      toast({
        title: "Error",
        description: "There was a problem updating the supply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a supply item
  const handleDeleteSupply = async (id: number) => {
    // Find the item name first for the success message
    const item = supplies.find(s => s.id === id);
    const itemName = item?.name || 'Supply';
    
    try {
      // Send delete request to API
      const response = await fetch(`/api/supplies/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete supply');
      }
      
      // Refresh the supplies list
      queryClient.invalidateQueries({ queryKey: ['/api/supplies'] });
      
      toast({
        title: "Supply deleted",
        description: `${itemName} has been removed from your supplies list`
      });
    } catch (error) {
      console.error('Error deleting supply:', error);
      toast({
        title: "Error",
        description: "There was a problem deleting the supply. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Supplies" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
        actions={
          <Button size="sm" onClick={handleAddSupply}>
            <Plus className="mr-2 h-4 w-4" /> Add Supplies
          </Button>
        }
      />
      
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Supplies"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <Select 
              value={selectedCategory} 
              onValueChange={(value) => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-40">
                <FilterIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Supplies" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplies</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Item Price</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="flex justify-center items-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span className="ml-2">Loading supplies...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSupplies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No supplies found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSupplies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <button 
                        className="text-blue-600 hover:underline text-left font-medium"
                        onClick={() => handleEditSupply(item)}
                      >
                        {item.name}
                      </button>
                    </TableCell>
                    <TableCell>{item.supplier || '-'}</TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell>{item.price ? `$${parseFloat(item.price).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      {item.quantity !== undefined ? (
                        <span className={item.reorder_level && item.quantity <= item.reorder_level ? 'text-red-500 font-medium' : ''}>
                          {item.quantity}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-500 hover:text-blue-600"
                          onClick={() => handleEditSupply(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteSupply(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Add Supply Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Add New Supply</DialogTitle>
          <DialogDescription>
            Add details for your new supply item. Fields marked with * are required.
          </DialogDescription>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <Input
                id="name"
                placeholder="Supply name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">
                Supplier
              </Label>
              <Input
                id="supplier"
                placeholder="Supplier name"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price ($)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reorder_level" className="text-right">
                Reorder Level
              </Label>
              <Input
                id="reorder_level"
                type="number"
                placeholder="5"
                value={formData.reorder_level}
                onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewSupply} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Saving</span>
                </div>
              ) : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Supply Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Edit Supply</DialogTitle>
          <DialogDescription>
            Update details for this supply item. Fields marked with * are required.
          </DialogDescription>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name*
              </Label>
              <Input
                id="edit-name"
                placeholder="Supply name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-supplier" className="text-right">
                Supplier
              </Label>
              <Input
                id="edit-supplier"
                placeholder="Supplier name"
                value={editFormData.supplier}
                onChange={(e) => setEditFormData({...editFormData, supplier: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select
                value={editFormData.category}
                onValueChange={(value) => setEditFormData({...editFormData, category: value})}
              >
                <SelectTrigger id="edit-category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price ($)
              </Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editFormData.price}
                onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="edit-quantity"
                type="number"
                placeholder="0"
                value={editFormData.quantity}
                onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-reorder_level" className="text-right">
                Reorder Level
              </Label>
              <Input
                id="edit-reorder_level"
                type="number"
                placeholder="5"
                value={editFormData.reorder_level}
                onChange={(e) => setEditFormData({...editFormData, reorder_level: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                placeholder="Optional description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSupply} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Updating</span>
                </div>
              ) : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliesList;