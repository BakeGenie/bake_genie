import React from "react";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const SuppliesList = () => {
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Supplies List" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
      />
      
      <div className="mt-6">
        <p className="text-gray-600">Supplies list management will be implemented here.</p>
        <div className="mt-4">
          <Button onClick={() => navigate("/recipes")}>
            Back to Recipes & Ingredients
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuppliesList;