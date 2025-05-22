import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
  Search, 
  Trash2, 
  Plus,
  FilterIcon,
  Loader2
} from "lucide-react";
import AddBundleDialog from "@/components/bundle/add-bundle-dialog";

// Define bundle type
interface Bundle {
  id: number;
  name: string;
  userId: number;
  category?: string;
  price?: string | number;
  description?: string;
  createdAt: string;
  items?: any[];
}

// Define category options
const categories = ["All Categories", "Cake", "Macaron", "Cookie", "Cupcake", "Other"];

const Bundles = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const queryClient = useQueryClient();
  
  // Fetch bundles from API
  const { 
    data: bundles = [], 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/bundles'],
    queryFn: async () => {
      const response = await fetch('/api/bundles');
      if (!response.ok) {
        throw new Error('Failed to fetch bundles');
      }
      return response.json();
    }
  });
  
  // Filter bundles based on search query and selected category
  const filteredBundles = bundles.filter(bundle => {
    const matchesSearch = bundle.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || bundle.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Handle delete bundle
  const handleDeleteBundle = async (id: number) => {
    const bundleToDelete = bundles.find(b => b.id === id);
    if (bundleToDelete) {
      try {
        const response = await fetch(`/api/bundles/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete bundle');
        }
        
        // Show confirmation toast
        toast({
          title: "Bundle deleted",
          description: `"${bundleToDelete.name}" has been removed`,
          duration: 3000,
        });
        
        // Refresh the bundles list
        queryClient.invalidateQueries({ queryKey: ['/api/bundles'] });
      } catch (error) {
        console.error('Error deleting bundle:', error);
        toast({
          title: "Error",
          description: "There was a problem deleting the bundle. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="My Bundles" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
        actions={
          <AddBundleDialog 
            onSave={async (bundleData) => {
              try {
                // Prepare the bundle data for API
                const bundlePayload = {
                  name: bundleData.name,
                  category: bundleData.category,
                  price: bundleData.price,
                  description: ""
                };
                
                // Send to API
                const response = await fetch('/api/bundles', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(bundlePayload),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to create bundle');
                }
                
                // Refresh the bundles list
                queryClient.invalidateQueries({ queryKey: ['/api/bundles'] });
                
                // Show success notification
                toast({
                  title: "Bundle created",
                  description: `${bundleData.name} has been added to your bundles`,
                  duration: 3000,
                });
              } catch (error) {
                console.error('Error creating bundle:', error);
                toast({
                  title: "Error",
                  description: "There was a problem creating the bundle. Please try again.",
                  variant: "destructive"
                });
              }
            }}
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> New Bundle
              </Button>
            }
          />
        }
      />
      
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Bundles"
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
                <SelectValue placeholder="All Categories" />
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
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading bundles...</span>
          </div>
        ) : isError ? (
          <div className="rounded-md border p-8 text-center">
            <p className="text-red-500">Error loading bundles. Please try again.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBundles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No bundles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBundles.map((bundle) => (
                    <TableRow key={bundle.id}>
                      <TableCell className="font-medium">
                        <a href="#" onClick={(e) => {
                          e.preventDefault();
                          navigate(`/recipes/bundles/${bundle.id}`);
                        }} className="text-blue-600 hover:underline">
                          {bundle.name}
                        </a>
                      </TableCell>
                      <TableCell>{bundle.category || '-'}</TableCell>
                      <TableCell>
                        {bundle.price ? `$${typeof bundle.price === 'string' ? parseFloat(bundle.price).toFixed(2) : bundle.price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteBundle(bundle.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bundles;