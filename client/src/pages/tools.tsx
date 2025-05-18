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
  ImageIcon,
  HeartIcon,
  RectangleHorizontalIcon
} from "lucide-react";

const Tools = () => {
  const { toast } = useToast();
  const [activeCalculator, setActiveCalculator] = React.useState("portion");
  const [cakeShape, setCakeShape] = React.useState("round");
  const [cakeSize, setCakeSize] = React.useState("8");
  const [servingStyle, setServingStyle] = React.useState("party");
  const [numberOfTiers, setNumberOfTiers] = React.useState("1");
  const [cakeHeight, setCakeHeight] = React.useState("standard");
  const [canvasColor, setCanvasColor] = React.useState("#ffffff");
  
  // Tin conversion calculator state
  const [tinOriginalShape, setTinOriginalShape] = React.useState("round");
  const [tinNewShape, setTinNewShape] = React.useState("round");
  const [tinOriginalDiameter, setTinOriginalDiameter] = React.useState("");
  const [tinOriginalHeight, setTinOriginalHeight] = React.useState("");
  const [tinNewDiameter, setTinNewDiameter] = React.useState("");
  const [tinNewHeight, setTinNewHeight] = React.useState("");
  const [tinMeasurementUnit, setTinMeasurementUnit] = React.useState("cm");
  const [tinIngredients, setTinIngredients] = React.useState<Array<{name: string; quantity: string; unit: string}>>([]);
  const [tinIngredientName, setTinIngredientName] = React.useState("");
  const [tinIngredientQuantity, setTinIngredientQuantity] = React.useState("");
  const [tinIngredientUnit, setTinIngredientUnit] = React.useState("each");
  
  // Cake designer dimensions state
  const [bottomTierDiameter, setBottomTierDiameter] = React.useState(10);
  const [bottomTierHeight, setBottomTierHeight] = React.useState(5);
  const [middleTierDiameter, setMiddleTierDiameter] = React.useState(8);
  const [middleTierHeight, setMiddleTierHeight] = React.useState(4);
  const [topTierDiameter, setTopTierDiameter] = React.useState(6);
  const [topTierHeight, setTopTierHeight] = React.useState(3);

  // Calculate portions based on selected options
  const calculatePortions = () => {
    // Basic calculation logic (simplified for example)
    const size = parseInt(cakeSize, 10);
    const servingMultiplier = servingStyle === "party" ? 1.5 : 
                             servingStyle === "wedding" ? 2 : 1;
    
    // Height multiplier based on cake height option
    const heightMultiplier = cakeHeight === "standard" ? 1 : 
                           cakeHeight === "extended" ? 1.5 :
                           cakeHeight === "double" ? 2 : 2.5; // triple barrel
    
    let basePortions = 0;
    if (cakeShape === "round") {
      basePortions = Math.floor(Math.PI * (size * size) / 16);
    } else {
      basePortions = Math.floor((size * size) / 8);
    }
    
    const tierMultiplier = parseInt(numberOfTiers, 10);
    return Math.floor(basePortions * servingMultiplier * tierMultiplier * heightMultiplier);
  };
  
  // Calculate tin conversion scale factor
  const calculateScaleFactor = () => {
    // Return 1 if any required measurement is missing
    if (!tinOriginalDiameter || !tinNewDiameter) {
      return 1;
    }
    
    const origDiameter = parseFloat(tinOriginalDiameter);
    const newDiameter = parseFloat(tinNewDiameter);
    const origHeight = parseFloat(tinOriginalHeight || "1");
    const newHeight = parseFloat(tinNewHeight || "1");
    
    // Calculate the volumes based on shape
    let origVolume = 0;
    let newVolume = 0;
    
    if (tinOriginalShape === "round") {
      // Volume = π * r² * h
      origVolume = Math.PI * Math.pow(origDiameter / 2, 2) * origHeight;
    } else {
      // Square/Rectangle: Volume = l * w * h 
      // For square, l = w = diameter
      origVolume = origDiameter * origDiameter * origHeight;
    }
    
    if (tinNewShape === "round") {
      newVolume = Math.PI * Math.pow(newDiameter / 2, 2) * newHeight;
    } else {
      newVolume = newDiameter * newDiameter * newHeight;
    }
    
    // Calculate scale factor
    return newVolume / origVolume;
  };
  
  // Calculate new recipe amounts
  const calculateNewRecipeAmounts = () => {
    const scaleFactor = calculateScaleFactor();
    
    return tinIngredients.map(ingredient => {
      const origQuantity = parseFloat(ingredient.quantity);
      const newQuantity = (origQuantity * scaleFactor).toFixed(2);
      
      return {
        name: ingredient.name,
        origQuantity: ingredient.quantity,
        newQuantity,
        unit: ingredient.unit
      };
    });
  };
  
  // Update recipe with new tin sizes
  const calculateTinConversion = () => {
    if (!tinOriginalDiameter || !tinNewDiameter) {
      toast({
        title: "Missing measurements",
        description: "Please enter both original and new tin dimensions",
        variant: "destructive"
      });
      return;
    }
    
    if (tinIngredients.length === 0) {
      toast({
        title: "No ingredients added",
        description: "Please add at least one ingredient to your recipe",
        variant: "destructive"
      });
      return;
    }
    
    const scaleFactor = calculateScaleFactor();
    
    toast({
      title: "Recipe Updated",
      description: `Your recipe has been scaled by a factor of ${scaleFactor.toFixed(2)}`,
    });
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

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Portion Calculator */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCalculator("portion")}>
          <CardHeader className="p-3">
            <div className="flex items-center">
              <CakeIcon className="h-4 w-4 mr-2 text-primary-500 flex-shrink-0" />
              <CardTitle className="text-base">Portion Calculator</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <CardDescription className="text-xs h-8">Calculate cake servings with tier options</CardDescription>
            <div className="h-16 bg-gray-50 rounded-md flex items-center justify-center border">
              <CalculatorIcon className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Tin Conversion Calculator */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCalculator("tin")}>
          <CardHeader className="p-3">
            <div className="flex items-center">
              <RulerIcon className="h-4 w-4 mr-2 text-primary-500 flex-shrink-0" />
              <CardTitle className="text-base">Tin Conversion</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <CardDescription className="text-xs h-8">Scale recipes for different tin sizes</CardDescription>
            <div className="h-16 bg-gray-50 rounded-md flex items-center justify-center border">
              <div className="flex flex-col items-center">
                <CircleIcon className="h-4 w-4 text-gray-400" />
                <PlusIcon className="h-3 w-3 text-gray-400 my-1" />
                <SquareIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cake Template Designer */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCalculator("designer")}>
          <CardHeader className="p-3">
            <div className="flex items-center">
              <PencilIcon className="h-4 w-4 mr-2 text-primary-500 flex-shrink-0" />
              <CardTitle className="text-base">Cake Designer</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <CardDescription className="text-xs h-8">Design multi-tier cakes with decorations</CardDescription>
            <div className="h-16 bg-gray-50 rounded-md flex items-center justify-center border">
              <CakeIcon className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Overhead Calculator */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCalculator("overhead")}>
          <CardHeader className="p-3">
            <div className="flex items-center">
              <CalculatorIcon className="h-4 w-4 mr-2 text-primary-500 flex-shrink-0" />
              <CardTitle className="text-base">Overheads</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <CardDescription className="text-xs h-8">Calculate your business overhead costs</CardDescription>
            <div className="h-16 bg-gray-50 rounded-md flex items-center justify-center border">
              <Drill className="h-6 w-6 text-gray-400" />
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
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button"
                      className={`flex items-center py-1.5 px-3 rounded border ${
                        cakeShape === "round" 
                          ? "border-primary-500 bg-primary-50 text-primary-700" 
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setCakeShape("round")}
                    >
                      <CircleIcon className={`h-4 w-4 mr-1.5 ${
                        cakeShape === "round" ? "text-primary-500" : "text-gray-400"
                      }`} />
                      Round
                    </button>
                    
                    <button 
                      type="button"
                      className={`flex items-center py-1.5 px-3 rounded border ${
                        cakeShape === "square" 
                          ? "border-primary-500 bg-primary-50 text-primary-700" 
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setCakeShape("square")}
                    >
                      <SquareIcon className={`h-4 w-4 mr-1.5 ${
                        cakeShape === "square" ? "text-primary-500" : "text-gray-400"
                      }`} />
                      Square
                    </button>

                    <button 
                      type="button"
                      className={`flex items-center py-1.5 px-3 rounded border ${
                        cakeShape === "heart" 
                          ? "border-primary-500 bg-primary-50 text-primary-700" 
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setCakeShape("heart")}
                    >
                      <HeartIcon className={`h-4 w-4 mr-1.5 ${
                        cakeShape === "heart" ? "text-primary-500" : "text-gray-400"
                      }`} />
                      Heart
                    </button>
                    
                    <button 
                      type="button"
                      className={`flex items-center py-1.5 px-3 rounded border ${
                        cakeShape === "rectangle" 
                          ? "border-primary-500 bg-primary-50 text-primary-700" 
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setCakeShape("rectangle")}
                    >
                      <RectangleHorizontalIcon className={`h-4 w-4 mr-1.5 ${
                        cakeShape === "rectangle" ? "text-primary-500" : "text-gray-400"
                      }`} />
                      Slab
                    </button>
                  </div>
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

                <div>
                  <Label className="mb-2 block">Cake Height</Label>
                  <Select value={cakeHeight} onValueChange={setCakeHeight}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select cake height" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (4 inches)</SelectItem>
                      <SelectItem value="extended">Extended (6 inches)</SelectItem>
                      <SelectItem value="double">Double Barrel (8 inches)</SelectItem>
                      <SelectItem value="triple">Triple Barrel (10 inches)</SelectItem>
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
                      Based on {cakeShape} {cakeSize}" cake with {numberOfTiers} tier(s), {cakeHeight === "standard" ? "4\"" : 
                      cakeHeight === "extended" ? "6\"" : 
                      cakeHeight === "double" ? "8\"" : "10\""} height, in {servingStyle} size
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
                <h3 className="font-medium">Enter Details below</h3>
                
                {/* Existing Recipe Section */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Existing Recipe</h4>
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="ingredient-name">Ingredient</Label>
                        <Input
                          id="ingredient-name"
                          value={tinIngredientName}
                          onChange={(e) => setTinIngredientName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="w-24">
                        <Label htmlFor="ingredient-quantity">Quantity</Label>
                        <Input
                          id="ingredient-quantity"
                          type="number"
                          value={tinIngredientQuantity}
                          onChange={(e) => setTinIngredientQuantity(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="w-32">
                        <Label htmlFor="ingredient-unit">Unit</Label>
                        <Select
                          value={tinIngredientUnit}
                          onValueChange={setTinIngredientUnit}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="each">each</SelectItem>
                            <SelectItem value="g">grams</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="oz">oz</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                            <SelectItem value="cup">cups</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="l">liters</SelectItem>
                            <SelectItem value="tsp">tsp</SelectItem>
                            <SelectItem value="tbsp">tbsp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={() => {
                          if (tinIngredientName && tinIngredientQuantity) {
                            setTinIngredients([
                              ...tinIngredients,
                              {
                                name: tinIngredientName,
                                quantity: tinIngredientQuantity,
                                unit: tinIngredientUnit
                              }
                            ]);
                            setTinIngredientName("");
                            setTinIngredientQuantity("");
                          }
                        }}
                        variant="secondary"
                      >
                        Add Ingredient
                      </Button>
                      <Button 
                        onClick={() => setTinIngredients([])}
                        variant="outline"
                      >
                        Reset All
                      </Button>
                    </div>
                    
                    {tinIngredients.length > 0 && (
                      <div className="mt-4">
                        <ul className="space-y-1">
                          {tinIngredients.map((ingredient, index) => (
                            <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span>{ingredient.name} - {ingredient.quantity} {ingredient.unit}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setTinIngredients(tinIngredients.filter((_, i) => i !== index));
                                }}
                              >
                                <MinusIcon className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Existing and New Baking Tin Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Existing Baking Tin</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <Label className="whitespace-nowrap">Shape:</Label>
                          <RadioGroup 
                            className="flex space-x-4" 
                            value={tinOriginalShape}
                            onValueChange={setTinOriginalShape}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="round" id="original-round" />
                              <Label htmlFor="original-round">Round</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="square" id="original-square" />
                              <Label htmlFor="original-square">Square / Sheet</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div>
                            <Label htmlFor="original-diameter">Diameter:</Label>
                            <Input 
                              id="original-diameter"
                              value={tinOriginalDiameter}
                              onChange={(e) => setTinOriginalDiameter(e.target.value)}
                              type="number"
                              className="w-20 mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="original-height">Height:</Label>
                            <Input 
                              id="original-height"
                              value={tinOriginalHeight}
                              onChange={(e) => setTinOriginalHeight(e.target.value)}
                              type="number"
                              className="w-20 mt-1"
                            />
                          </div>
                          <div>
                            <Select
                              value={tinMeasurementUnit}
                              onValueChange={setTinMeasurementUnit}
                            >
                              <SelectTrigger className="w-20 mt-5">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="inches">inches</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">New Baking Tin</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <Label className="whitespace-nowrap">Shape:</Label>
                          <RadioGroup 
                            className="flex space-x-4" 
                            value={tinNewShape}
                            onValueChange={setTinNewShape}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="round" id="new-round" />
                              <Label htmlFor="new-round">Round</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="square" id="new-square" />
                              <Label htmlFor="new-square">Square / Sheet</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div>
                            <Label htmlFor="new-diameter">Diameter:</Label>
                            <Input 
                              id="new-diameter"
                              value={tinNewDiameter}
                              onChange={(e) => setTinNewDiameter(e.target.value)}
                              type="number"
                              className="w-20 mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-height">Height:</Label>
                            <Input 
                              id="new-height"
                              value={tinNewHeight}
                              onChange={(e) => setTinNewHeight(e.target.value)}
                              type="number"
                              className="w-20 mt-1"
                            />
                          </div>
                          <div>
                            <div className="w-20 mt-5 py-2 px-3 border rounded bg-gray-50 text-center">
                              {tinMeasurementUnit}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={calculateTinConversion}
                      className="w-full md:w-auto"
                    >
                      Update Recipe
                    </Button>
                  </div>
                  
                  {tinIngredients.length > 0 && tinOriginalDiameter && tinNewDiameter && (
                    <div className="mt-6 bg-gray-50 p-4 rounded">
                      <h3 className="font-medium text-lg mb-4">New Recipe</h3>
                      {calculateNewRecipeAmounts().map((ingredient, index) => (
                        <div key={index} className="mb-2 p-2 bg-white rounded shadow-sm">
                          <div className="font-medium">{ingredient.name}</div>
                          <div>{ingredient.newQuantity} {ingredient.unit}</div>
                        </div>
                      ))}
                      <div className="text-sm text-gray-500 mt-4 text-center">
                        <div className="font-medium">Scale factor: {calculateScaleFactor().toFixed(2)}x</div>
                        Your new recipe will appear here automatically!
                      </div>
                    </div>
                  )}
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
                      <Label className="mb-2 block">Tier Dimensions (inches)</Label>
                      <div className="space-y-4">
                        {/* Bottom Tier */}
                        <div className="border rounded p-2 bg-gray-50">
                          <div className="font-medium mb-1">Bottom Tier</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Diameter: {bottomTierDiameter}"</span>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setBottomTierDiameter(Math.max(6, bottomTierDiameter - 1))}
                                  disabled={bottomTierDiameter <= 6}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{bottomTierDiameter}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setBottomTierDiameter(Math.min(16, bottomTierDiameter + 1))}
                                  disabled={bottomTierDiameter >= 16}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Height: {bottomTierHeight}"</span>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setBottomTierHeight(Math.max(2, bottomTierHeight - 1))}
                                  disabled={bottomTierHeight <= 2}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{bottomTierHeight}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setBottomTierHeight(Math.min(10, bottomTierHeight + 1))}
                                  disabled={bottomTierHeight >= 10}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Middle Tier */}
                        <div className="border rounded p-2 bg-gray-50">
                          <div className="font-medium mb-1">Middle Tier</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Diameter: {middleTierDiameter}"</span>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setMiddleTierDiameter(Math.max(4, middleTierDiameter - 1))}
                                  disabled={middleTierDiameter <= 4}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{middleTierDiameter}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setMiddleTierDiameter(Math.min(14, middleTierDiameter + 1))}
                                  disabled={middleTierDiameter >= 14 || middleTierDiameter >= bottomTierDiameter}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Height: {middleTierHeight}"</span>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setMiddleTierHeight(Math.max(2, middleTierHeight - 1))}
                                  disabled={middleTierHeight <= 2}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{middleTierHeight}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setMiddleTierHeight(Math.min(8, middleTierHeight + 1))}
                                  disabled={middleTierHeight >= 8}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Top Tier */}
                        <div className="border rounded p-2 bg-gray-50">
                          <div className="font-medium mb-1">Top Tier</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Diameter: {topTierDiameter}"</span>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setTopTierDiameter(Math.max(3, topTierDiameter - 1))}
                                  disabled={topTierDiameter <= 3}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{topTierDiameter}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setTopTierDiameter(Math.min(12, topTierDiameter + 1))}
                                  disabled={topTierDiameter >= 12 || topTierDiameter >= middleTierDiameter}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Height: {topTierHeight}"</span>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setTopTierHeight(Math.max(1, topTierHeight - 1))}
                                  disabled={topTierHeight <= 1}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{topTierHeight}</span>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setTopTierHeight(Math.min(6, topTierHeight + 1))}
                                  disabled={topTierHeight >= 6}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
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
                        {/* Dynamic cake tiers visualization based on user-defined dimensions */}
                        <div className="relative flex items-center justify-center w-full h-full">
                          {/* SVG representation of the stacked cake tiers with adjustable dimensions */}
                          <svg width="200" height="300" viewBox="0 0 200 300" className="absolute">
                            {/* Calculate SVG values based on tier dimensions */}
                            {(() => {
                              // Scale factors to convert inches to SVG units
                              const SCALE_X = 9; // horizontal scale
                              const SCALE_Y = 10; // vertical scale
                              const ELLIPSE_RATIO = 0.22; // ratio for ellipse height
                              
                              // Calculate bottom tier
                              const bottomRadius = bottomTierDiameter * SCALE_X / 2;
                              const bottomHeight = bottomTierHeight * SCALE_Y;
                              const bottomEllipseRy = bottomRadius * ELLIPSE_RATIO;
                              const bottomY = 230;
                              const bottomX = 100;
                              
                              // Calculate middle tier
                              const middleRadius = middleTierDiameter * SCALE_X / 2;
                              const middleHeight = middleTierHeight * SCALE_Y;
                              const middleEllipseRy = middleRadius * ELLIPSE_RATIO;
                              const middleY = bottomY - bottomHeight;
                              const middleX = 100;
                              
                              // Calculate top tier
                              const topRadius = topTierDiameter * SCALE_X / 2;
                              const topHeight = topTierHeight * SCALE_Y;
                              const topEllipseRy = topRadius * ELLIPSE_RATIO;
                              const topY = middleY - middleHeight;
                              const topX = 100;
                              
                              return (
                                <>
                                  {/* Bottom tier */}
                                  <g>
                                    <ellipse cx={bottomX} cy={bottomY} rx={bottomRadius} ry={bottomEllipseRy} stroke="#333" fill="transparent" strokeWidth="1" />
                                    <rect x={bottomX - bottomRadius} y={bottomY - bottomHeight} width={bottomRadius * 2} height={bottomHeight} fill="transparent" stroke="none" />
                                    <line x1={bottomX - bottomRadius} y1={bottomY - bottomHeight} x2={bottomX - bottomRadius} y2={bottomY} stroke="#333" strokeWidth="1" />
                                    <line x1={bottomX + bottomRadius} y1={bottomY - bottomHeight} x2={bottomX + bottomRadius} y2={bottomY} stroke="#333" strokeWidth="1" />
                                    <ellipse cx={bottomX} cy={bottomY - bottomHeight} rx={bottomRadius} ry={bottomEllipseRy} stroke="#333" fill="transparent" strokeWidth="1" />
                                  </g>
                                  
                                  {/* Middle tier */}
                                  <g>
                                    <ellipse cx={middleX} cy={middleY} rx={middleRadius} ry={middleEllipseRy} stroke="#333" fill="transparent" strokeWidth="1" />
                                    <rect x={middleX - middleRadius} y={middleY - middleHeight} width={middleRadius * 2} height={middleHeight} fill="transparent" stroke="none" />
                                    <line x1={middleX - middleRadius} y1={middleY - middleHeight} x2={middleX - middleRadius} y2={middleY} stroke="#333" strokeWidth="1" />
                                    <line x1={middleX + middleRadius} y1={middleY - middleHeight} x2={middleX + middleRadius} y2={middleY} stroke="#333" strokeWidth="1" />
                                    <ellipse cx={middleX} cy={middleY - middleHeight} rx={middleRadius} ry={middleEllipseRy} stroke="#333" fill="transparent" strokeWidth="1" />
                                  </g>
                                  
                                  {/* Top tier */}
                                  <g>
                                    <ellipse cx={topX} cy={topY} rx={topRadius} ry={topEllipseRy} stroke="#333" fill="transparent" strokeWidth="1" />
                                    <rect x={topX - topRadius} y={topY - topHeight} width={topRadius * 2} height={topHeight} fill="transparent" stroke="none" />
                                    <line x1={topX - topRadius} y1={topY - topHeight} x2={topX - topRadius} y2={topY} stroke="#333" strokeWidth="1" />
                                    <line x1={topX + topRadius} y1={topY - topHeight} x2={topX + topRadius} y2={topY} stroke="#333" strokeWidth="1" />
                                    <ellipse cx={topX} cy={topY - topHeight} rx={topRadius} ry={topEllipseRy} stroke="#333" fill="transparent" strokeWidth="1" />
                                  </g>
                                </>
                              );
                            })()}
                          </svg>
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
