import React from "react";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRightIcon } from "lucide-react";

const RecipesPage = () => {
  const [, navigate] = useLocation();

  const sections = [
    {
      id: "recipes-list",
      title: "Recipes",
      description: "Manage your recipes",
      route: "/recipes/recipes-list"
    },
    {
      id: "ingredients-list",
      title: "Ingredients",
      description: "Manage your ingredients",
      route: "/recipes/ingredients-list"
    },
    {
      id: "supplies-list",
      title: "Supplies List",
      description: "Manage your supplies",
      route: "/recipes/supplies-list"
    },
    {
      id: "master-ingredients",
      title: "Master Ingredient List",
      description: "View and edit master ingredients",
      route: "/recipes/master-ingredients"
    },
    {
      id: "bundles",
      title: "My Bundles",
      description: "Manage recipe bundles",
      route: "/recipes/bundles"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader title="Recipes & Ingredients" />
      
      <div className="space-y-4 mt-6">
        {sections.map((section) => (
          <Card 
            key={section.id} 
            className="hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => window.location.href = section.route}
          >
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecipesPage;