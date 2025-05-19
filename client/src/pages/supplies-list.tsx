import React, { useState } from "react";
import { useLocation } from "wouter";
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

// Define supply item type
interface SupplyItem {
  id: number;
  name: string;
  supplier?: string;
  category?: string;
  price?: number;
}

// Define category options
const categories = ["All Supplies", "Boards & Cards", "Packaging", "Decorations", "Tools", "Other"];

const SuppliesList = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Supplies");
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  
  // Filter supplies based on search query and selected category
  const filteredSupplies = supplies.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Supplies" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Supplies" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
        actions={
          <Button size="sm">
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
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSupplies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No supplies found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSupplies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <a href="#" className="text-blue-600 hover:underline">
                        {item.name}
                      </a>
                    </TableCell>
                    <TableCell>{item.supplier || '-'}</TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell>{item.price ? `$ ${item.price.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
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

export default SuppliesList;