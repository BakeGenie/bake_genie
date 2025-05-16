import React from "react";
import PageHeader from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DownloadIcon,
  PrinterIcon,
  CakeIcon,
  FileIcon,
  LayoutIcon,
  ScissorsIcon,
  CircleIcon
} from "lucide-react";

const Printables = () => {
  const { toast } = useToast();

  // Cake serving guides
  const servingGuides = [
    {
      id: "round-serving",
      title: "Round Cake Serving Guide",
      description: "Standard serving sizes for round cakes",
      icon: <CircleIcon className="h-10 w-10" />,
    },
    {
      id: "square-serving",
      title: "Square Cake Serving Guide",
      description: "Standard serving sizes for square cakes",
      icon: <LayoutIcon className="h-10 w-10" />,
    },
    {
      id: "wedding-serving",
      title: "Wedding Cake Serving Guide",
      description: "Serving sizes for multi-tier wedding cakes",
      icon: <CakeIcon className="h-10 w-10" />,
    },
    {
      id: "portion-guide",
      title: "Portion Cutting Guide",
      description: "How to cut cakes for different party sizes",
      icon: <ScissorsIcon className="h-10 w-10" />,
    },
  ];

  // Business forms
  const businessForms = [
    {
      id: "order-form",
      title: "Order Form",
      description: "Printable order form for in-person consultations",
      icon: <FileIcon className="h-10 w-10" />,
    },
    {
      id: "invoice-template",
      title: "Invoice Template",
      description: "Customizable invoice template",
      icon: <FileIcon className="h-10 w-10" />,
    },
    {
      id: "delivery-note",
      title: "Delivery Note",
      description: "Form for cake delivery details",
      icon: <FileIcon className="h-10 w-10" />,
    },
    {
      id: "allergen-card",
      title: "Allergen Information Card",
      description: "Allergen information template for your products",
      icon: <FileIcon className="h-10 w-10" />,
    },
  ];

  // Recipe cards
  const recipeCards = [
    {
      id: "recipe-card",
      title: "Basic Recipe Card",
      description: "Template for printing recipe cards",
      icon: <FileIcon className="h-10 w-10" />,
    },
    {
      id: "ingredient-conversion",
      title: "Ingredient Conversion Chart",
      description: "Common baking measurements and conversions",
      icon: <FileIcon className="h-10 w-10" />,
    },
  ];

  // Handle download
  const handleDownload = (itemId: string) => {
    toast({
      title: "Download Started",
      description: "Your printable is being downloaded.",
    });
  };

  // Handle print
  const handlePrint = (itemId: string) => {
    toast({
      title: "Preparing Print",
      description: "Your printable is being prepared for printing.",
    });
  };

  return (
    <div className="p-6">
      <PageHeader title="Printables" />

      <Tabs defaultValue="serving-guides" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="serving-guides">
            <CakeIcon className="h-4 w-4 mr-2" /> Cake Serving Guides
          </TabsTrigger>
          <TabsTrigger value="business-forms">
            <FileIcon className="h-4 w-4 mr-2" /> Business Forms
          </TabsTrigger>
          <TabsTrigger value="recipe-cards">
            <LayoutIcon className="h-4 w-4 mr-2" /> Recipe Cards
          </TabsTrigger>
        </TabsList>
        
        {/* Cake Serving Guides Tab */}
        <TabsContent value="serving-guides" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servingGuides.map((guide) => (
              <Card key={guide.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="border rounded-md p-4 h-40 flex items-center justify-center bg-gray-50">
                    <div className="text-gray-400">
                      {guide.icon}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(guide.id)}
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" /> Print
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(guide.id)}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Business Forms Tab */}
        <TabsContent value="business-forms" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {businessForms.map((form) => (
              <Card key={form.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{form.title}</CardTitle>
                  <CardDescription>{form.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="border rounded-md p-4 h-40 flex items-center justify-center bg-gray-50">
                    <div className="text-gray-400">
                      {form.icon}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(form.id)}
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" /> Print
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(form.id)}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Recipe Cards Tab */}
        <TabsContent value="recipe-cards" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipeCards.map((card) => (
              <Card key={card.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="border rounded-md p-4 h-40 flex items-center justify-center bg-gray-50">
                    <div className="text-gray-400">
                      {card.icon}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(card.id)}
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" /> Print
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(card.id)}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Printables Section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">Your Custom Printables</h2>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <PrinterIcon className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Custom Printables Yet</h3>
            <p className="text-gray-500 mb-4">
              Create and save your own custom printables for future use.
            </p>
            <Button
              onClick={() => {
                toast({
                  title: "Custom Printables",
                  description: "Custom printable creation is coming soon.",
                });
              }}
            >
              Create Custom Printable
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Printables;
