import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
  FilterIcon
} from "lucide-react";
import AddBundleDialog from "@/components/bundle/add-bundle-dialog";

// Define bundle type
interface Bundle {
  id: number;
  name: string;
  category?: string;
  price?: number;
}

// Define category options
const categories = ["All Categories", "Cake", "Macaron", "Cookie", "Cupcake", "Other"];

const Bundles = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  
  // Sample demo data for bundles
  const [bundles, setBundles] = useState<Bundle[]>([
    { id: 1, name: "6pk Macaron Box", category: "Macaron", price: 4.10 },
    { id: 2, name: "6\" Vanilla Bean Buttercake", category: "Cake", price: 32.01 }
  ]);
  
  // Filter bundles based on search query and selected category
  const filteredBundles = bundles.filter(bundle => {
    const matchesSearch = bundle.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || bundle.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Handle delete bundle
  const handleDeleteBundle = (id: number) => {
    const bundleToDelete = bundles.find(b => b.id === id);
    if (bundleToDelete) {
      // Show confirmation toast
      toast({
        title: "Bundle deleted",
        description: `"${bundleToDelete.name}" has been removed`,
        duration: 3000,
      });
      
      // Remove bundle from state
      setBundles(bundles.filter(b => b.id !== id));
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
            onSave={(bundleData) => {
              // Here we would normally send data to API
              // For now, just add it to the local state
              const newBundle: Bundle = {
                id: Date.now(), // Generate a temporary ID
                name: bundleData.name,
                category: bundleData.category,
                price: parseFloat(bundleData.price)
              };
              setBundles([...bundles, newBundle]);
              
              // Show success notification
              // This would be nicer with a toast component
              alert("Bundle created successfully!");
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
                      <a href="#" className="text-blue-600 hover:underline">
                        {bundle.name}
                      </a>
                    </TableCell>
                    <TableCell>{bundle.category || '-'}</TableCell>
                    <TableCell>{bundle.price ? `$${bundle.price.toFixed(2)}` : '-'}</TableCell>
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
      </div>
    </div>
  );
};

export default Bundles;