import React from "react";
import PageHeader from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  CakeIcon,
  CalculatorIcon,
  PencilIcon,
  CircleIcon,
  SquareIcon,
  RulerIcon,
  Palette,
  Download,
  Drill,
  SaveIcon,
  PlusIcon,
  MinusIcon,
  TextIcon,
  ImageIcon
} from "lucide-react";

const Tools = () => {
  const { toast } = useToast();
  const [activeCalculator, setActiveCalculator] = React.useState("portion");
  const [cakeShape, setCakeShape] = React.useState("round");
  const [cakeSize, setCakeSize] = React.useState("8");
  const [servingStyle, setServingStyle] = React.useState("party");
  const [numberOfTiers, setNumberOfTiers] = React.useState("1");
  const [canvasColor, setCanvasColor] = React.useState("#ffffff");

  // Calculate portions based on selected options
  const calculatePortions = () => {
    // Basic calculation logic (simplified for example)
    const size = parseInt(cakeSize, 10);
    const multiplier = servingStyle === "party" ? 1.5 : 
                      servingStyle === "wedding" ? 2 : 1;
    
    let basePortions = 0;
    if (cakeShape === "round") {
      basePortions = Math.floor(Math.PI * (size * size) / 16);
    } else {
      basePortions = Math.floor((size * size) / 8);
    }
    
    const tierMultiplier = parseInt(numberOfTiers, 10);
    return Math.floor(basePortions * multiplier * tierMultiplier);
  };

  // Handle design save
  const handleSaveDesign = () => {
    toast({
      title: "Design Saved",
      description: "Your cake design has been saved.",
    });
  };

  // Handle design download
  const handleDownloadDesign = () => {
    toast({
      title: "Design Downloaded",
      description: "Your cake design is being downloaded.",
    });
  };

  return (
    <div className="p-6">
      <PageHeader title="Tools" />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Portion Calculator */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCalculator("portion")}>
          <CardHeader>
            <div className="flex items-center">
              <CakeIcon className="h-6 w-6 mr-2 text-primary-500" />
              <CardTitle>Portion Calculator</CardTitle>
            </div>
            <CardDescription>Calculate cake servings with tier options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center border">
              <CalculatorIcon className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Tin Conversion Calculator */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCalculator("tin")}>
          <CardHeader>
            <div className="flex items-center">
              <RulerIcon className="h-6 w-6 mr-2 text-primary-500" />
              <CardTitle>Tin Conversion</CardTitle>
            </div>
            <CardDescription>Scale recipes for different tin sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center border">
              <div className="flex flex-col items-center">
                <CircleIcon className="h-8 w-8 text-gray-400" />
                <PlusIcon className="h-4 w-4 text-gray-400 my-1" />
                <SquareIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cake Template Designer */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCalculator("designer")}>
          <CardHeader>
            <div className="flex items-center">
              <PencilIcon className="h-6 w-6 mr-2 text-primary-500" />
              <CardTitle>Cake Template Designer</CardTitle>
            </div>
            <CardDescription>Design multi-tier cakes with decorations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center border">
              <CakeIcon className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Overhead Calculator */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCalculator("overhead")}>
          <CardHeader>
            <div className="flex items-center">
              <CalculatorIcon className="h-6 w-6 mr-2 text-primary-500" />
              <CardTitle>Overheads Calculator</CardTitle>
            </div>
            <CardDescription>Calculate your business overhead costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center border">
              <Drill className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tool Content - changes based on selected calculator */}
      <div className="mt-8">
        {activeCalculator === "portion" && (
          <Card>
            <CardHeader>
              <CardTitle>Portion Calculator</CardTitle>
              <CardDescription>
                Calculate how many portions you'll get from your cake
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Cake Shape</Label>
                  <RadioGroup 
                    className="flex space-x-4"
                    value={cakeShape}
                    onValueChange={setCakeShape}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="round" id="round" />
                      <Label htmlFor="round" className="flex items-center">
                        <CircleIcon className="h-4 w-4 mr-2" /> Round
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="square" id="square" />
                      <Label htmlFor="square" className="flex items-center">
                        <SquareIcon className="h-4 w-4 mr-2" /> Square
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="mb-2 block">Cake Size (inches)</Label>
                  <Select value={cakeSize} onValueChange={setCakeSize}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select cake size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 inch</SelectItem>
                      <SelectItem value="8">8 inch</SelectItem>
                      <SelectItem value="10">10 inch</SelectItem>
                      <SelectItem value="12">12 inch</SelectItem>
                      <SelectItem value="14">14 inch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Serving Style</Label>
                  <Select value={servingStyle} onValueChange={setServingStyle}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select serving style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="party">Party Size (1.5" x 2")</SelectItem>
                      <SelectItem value="wedding">Wedding Size (1" x 2")</SelectItem>
                      <SelectItem value="dessert">Dessert Size (2" x 2")</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Number of Tiers</Label>
                  <Select value={numberOfTiers} onValueChange={setNumberOfTiers}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select number of tiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Tier</SelectItem>
                      <SelectItem value="2">2 Tiers</SelectItem>
                      <SelectItem value="3">3 Tiers</SelectItem>
                      <SelectItem value="4">4 Tiers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-4" />

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">Result</h3>
                    <div className="mt-2 text-3xl font-bold text-primary-600">
                      {calculatePortions()} portions
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Based on {cakeShape} {cakeSize}" cake with {numberOfTiers} tier(s) in {servingStyle} size
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeCalculator === "tin" && (
          <Card>
            <CardHeader>
              <CardTitle>Tin Conversion Calculator</CardTitle>
              <CardDescription>
                Scale your recipes to different tin sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Original Tin Shape</Label>
                    <RadioGroup defaultValue="round" className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="round" id="orig-round" />
                        <Label htmlFor="orig-round" className="flex items-center">
                          <CircleIcon className="h-4 w-4 mr-2" /> Round
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="square" id="orig-square" />
                        <Label htmlFor="orig-square" className="flex items-center">
                          <SquareIcon className="h-4 w-4 mr-2" /> Square
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">New Tin Shape</Label>
                    <RadioGroup defaultValue="round" className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="round" id="new-round" />
                        <Label htmlFor="new-round" className="flex items-center">
                          <CircleIcon className="h-4 w-4 mr-2" /> Round
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="square" id="new-square" />
                        <Label htmlFor="new-square" className="flex items-center">
                          <SquareIcon className="h-4 w-4 mr-2" /> Square
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Original Tin Size (inches)</Label>
                    <Select defaultValue="8">
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 inch</SelectItem>
                        <SelectItem value="8">8 inch</SelectItem>
                        <SelectItem value="10">10 inch</SelectItem>
                        <SelectItem value="12">12 inch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">New Tin Size (inches)</Label>
                    <Select defaultValue="10">
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 inch</SelectItem>
                        <SelectItem value="8">8 inch</SelectItem>
                        <SelectItem value="10">10 inch</SelectItem>
                        <SelectItem value="12">12 inch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Original Recipe Amount</Label>
                  <div className="flex space-x-2">
                    <Input type="number" defaultValue="1" className="w-20" />
                    <Select defaultValue="g">
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">grams</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="cup">cups</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="l">liters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">New Recipe Amount</h3>
                    <div className="mt-2 text-3xl font-bold text-primary-600">
                      1.56 grams
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Scale your ingredients by 1.56x for the new tin size
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeCalculator === "designer" && (
          <Card>
            <CardHeader>
              <CardTitle>Cake Template Designer</CardTitle>
              <CardDescription>
                Design your multi-tier cakes with custom decorations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="space-y-4 w-full md:w-64">
                    <div>
                      <Label className="mb-2 block">Tier Shape</Label>
                      <RadioGroup defaultValue="round" className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="round" id="design-round" />
                          <Label htmlFor="design-round" className="flex items-center">
                            <CircleIcon className="h-4 w-4 mr-2" /> Round
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="square" id="design-square" />
                          <Label htmlFor="design-square" className="flex items-center">
                            <SquareIcon className="h-4 w-4 mr-2" /> Square
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="mb-2 block">Number of Tiers</Label>
                      <Select defaultValue="2">
                        <SelectTrigger>
                          <SelectValue placeholder="Select tiers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Tier</SelectItem>
                          <SelectItem value="2">2 Tiers</SelectItem>
                          <SelectItem value="3">3 Tiers</SelectItem>
                          <SelectItem value="4">4 Tiers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-2 block">Tier Width (inches)</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Bottom Tier: 10"</span>
                          <Slider defaultValue={[10]} max={14} min={6} step={1} className="w-[120px]" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Top Tier: 6"</span>
                          <Slider defaultValue={[6]} max={14} min={4} step={1} className="w-[120px]" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Tier Colors</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button className="w-6 h-6 bg-white border rounded-full"></button>
                        <button className="w-6 h-6 bg-pink-200 border rounded-full"></button>
                        <button className="w-6 h-6 bg-blue-200 border rounded-full"></button>
                        <button className="w-6 h-6 bg-green-200 border rounded-full"></button>
                        <button className="w-6 h-6 bg-yellow-200 border rounded-full"></button>
                        <button className="w-6 h-6 bg-purple-200 border rounded-full"></button>
                        <button className="w-6 h-6 bg-red-200 border rounded-full"></button>
                        <button className="w-6 h-6 bg-orange-200 border rounded-full"></button>
                        <button className="w-6 h-6 border rounded-full flex items-center justify-center">
                          <Palette className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Decorations</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <button className="p-2 border rounded hover:bg-gray-50">
                          <CakeIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        <button className="p-2 border rounded hover:bg-gray-50">
                          <ImageIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        <button className="p-2 border rounded hover:bg-gray-50">
                          <TextIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        <button className="p-2 border rounded hover:bg-gray-50">
                          <PencilIcon className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={handleSaveDesign}
                      >
                        <SaveIcon className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleDownloadDesign}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download
                      </Button>
                    </div>
                  </div>

                  {/* Design Canvas */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="border rounded-md design-grid"
                      style={{ 
                        height: "400px",
                        backgroundColor: canvasColor,
                        backgroundImage: "radial-gradient(circle, #ddd 1px, transparent 1px)",
                        backgroundSize: "20px 20px" 
                      }}
                    >
                      <div className="relative h-full flex flex-col items-center justify-center">
                        {/* Sample cake tiers for visualization - cylinders instead of domes */}
                        <div className="absolute bottom-8 w-32 h-40">
                          {/* Bottom tier - cylinder */}
                          <div className="absolute bottom-0 w-32 h-20 bg-white border border-gray-300 rounded-sm overflow-hidden flex flex-col">
                            <div className="flex-grow rounded-sm"></div>
                            <div className="h-1 w-full bg-gray-100 rounded-full"></div>
                            <div className="h-1 w-full bg-white rounded-sm"></div>
                          </div>
                          
                          {/* Middle tier - cylinder */}
                          <div className="absolute bottom-16 left-4 w-24 h-16 bg-pink-100 border border-gray-300 rounded-sm overflow-hidden flex flex-col">
                            <div className="flex-grow rounded-sm"></div>
                            <div className="h-1 w-full bg-gray-100 rounded-full"></div>
                            <div className="h-1 w-full bg-pink-100 rounded-sm"></div>
                          </div>
                          
                          {/* Top tier - cylinder */}
                          <div className="absolute bottom-28 left-8 w-16 h-12 bg-white border border-gray-300 rounded-sm overflow-hidden flex flex-col">
                            <div className="flex-grow rounded-sm"></div>
                            <div className="h-1 w-full bg-gray-100 rounded-full"></div>
                            <div className="h-1 w-full bg-white rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 text-center">
                      Click and drag decorations onto the cake to design
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeCalculator === "overhead" && (
          <Card>
            <CardHeader>
              <CardTitle>Overhead Calculator</CardTitle>
              <CardDescription>
                Calculate your business overhead costs and pricing adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Monthly Fixed Costs</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rent">Rent/Mortgage</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">$</span>
                          <Input
                            id="rent"
                            type="number"
                            placeholder="0.00"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="utilities">Utilities</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">$</span>
                          <Input
                            id="utilities"
                            type="number"
                            placeholder="0.00"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="insurance">Insurance</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">$</span>
                          <Input
                            id="insurance"
                            type="number"
                            placeholder="0.00"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="equipment">Equipment Costs</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">$</span>
                          <Input
                            id="equipment"
                            type="number"
                            placeholder="0.00"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="other">Other Fixed Costs</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">$</span>
                          <Input
                            id="other"
                            type="number"
                            placeholder="0.00"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Business Details</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="orders">Average Monthly Orders</Label>
                        <Input
                          id="orders"
                          type="number"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="avg-price">Average Order Value</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">$</span>
                          <Input
                            id="avg-price"
                            type="number"
                            placeholder="0.00"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="labor-rate">Hourly Labor Rate</Label>
                        <div className="flex mt-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">$</span>
                          <Input
                            id="labor-rate"
                            type="number"
                            placeholder="0.00"
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="markup">Target Profit Margin (%)</Label>
                        <div className="flex mt-1">
                          <Input
                            id="markup"
                            type="number"
                            placeholder="0"
                            className="rounded-r-none"
                          />
                          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Monthly Overhead:</span>
                        <span className="font-medium">$1,200.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Overhead per Order:</span>
                        <span className="font-medium">$40.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Recommended Markup:</span>
                        <span className="font-medium">30%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Projected Monthly Revenue:</span>
                        <span className="font-medium">$3,000.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Projected Monthly Profit:</span>
                        <span className="font-medium text-green-600">$900.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Projected Annual Profit:</span>
                        <span className="font-medium text-green-600">$10,800.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      toast({
                        title: "Calculations Updated",
                        description: "Your overhead calculations have been updated.",
                      });
                    }}
                  >
                    <CalculatorIcon className="h-4 w-4 mr-2" /> Calculate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tools;
