import React, { useEffect } from "react";
import PageHeader from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRightIcon, CreditCardIcon, CurrencyIcon, DollarSignIcon, FileTextIcon, SettingsIcon, MailIcon, CalendarIcon, GlobeIcon, TypeIcon, LayersIcon, ClockIcon, PenIcon, PercentIcon, MapPinIcon, NotebookIcon, ReceiptIcon, FolderIcon, PizzaIcon, BarChartIcon, RulerIcon, SearchIcon, XIcon, CheckIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/settings-context";
import { Link } from "wouter";
import { EmailUpdatesSection } from "@/components/settings/email-updates-section";

const Settings = () => {
  const { toast } = useToast();
  // Get settings from context
  const { 
    settings, 
    isLoading,
    updateSettings,
    getCurrencySymbol
  } = useSettings();
  
  // Local state for UI interaction
  const [currency, setCurrency] = React.useState(settings.currency);
  const [weekStartDay, setWeekStartDay] = React.useState(settings.weekStartDay || "Monday");
  const [language, setLanguage] = React.useState(settings.language || "English");
  const [hourlyRate, setHourlyRate] = React.useState(settings.hourlyRate || "30.00");
  const [markupMargin, setMarkupMargin] = React.useState(settings.markupMargin || "40");
  
  // Update local state when settings load
  React.useEffect(() => {
    if (!isLoading) {
      setCurrency(settings.currency);
      setWeekStartDay(settings.weekStartDay || "Monday");
      setLanguage(settings.language || "English");
      setHourlyRate(settings.hourlyRate || "30.00");
      setMarkupMargin(settings.markupMargin || "40");
    }
  }, [isLoading, settings]);
  
  // Local state for dialogs
  const [showCurrencyDialog, setShowCurrencyDialog] = React.useState(false);
  const [showWeekStartDialog, setShowWeekStartDialog] = React.useState(false);
  
  // Currency options with top ones first, then alphabetical
  const currencyOptions = [
    // Top currencies
    { code: "AUD", symbol: "$", name: "Australian Dollar" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    // Other currencies alphabetically
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "ARS", symbol: "$", name: "Argentine Peso" },
    { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
    { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "CAD", symbol: "$", name: "Canadian Dollar" },
    { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
    { code: "CLP", symbol: "$", name: "Chilean Peso" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "COP", symbol: "$", name: "Colombian Peso" },
    { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
    { code: "DKK", symbol: "kr", name: "Danish Krone" },
    { code: "EGP", symbol: "£", name: "Egyptian Pound" },
    { code: "HKD", symbol: "$", name: "Hong Kong Dollar" },
    { code: "HRK", symbol: "kn", name: "Croatian Kuna" },
    { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
    { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
    { code: "KRW", symbol: "₩", name: "South Korean Won" },
    { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
    { code: "LKR", symbol: "₨", name: "Sri Lankan Rupee" },
    { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
    { code: "MXN", symbol: "$", name: "Mexican Peso" },
    { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
    { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
    { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
    { code: "PHP", symbol: "₱", name: "Philippine Peso" },
    { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
    { code: "PLN", symbol: "zł", name: "Polish Zloty" },
    { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal" },
    { code: "RON", symbol: "lei", name: "Romanian Leu" },
    { code: "RSD", symbol: "дин.", name: "Serbian Dinar" },
    { code: "SAR", symbol: "ر.س", name: "Saudi Riyal" },
    { code: "SEK", symbol: "kr", name: "Swedish Krona" },
    { code: "SGD", symbol: "$", name: "Singapore Dollar" },
    { code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "TRY", symbol: "₺", name: "Turkish Lira" },
    { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" },
    { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
    { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
  ];
  
  // Week start day options
  const weekStartOptions = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];
  
  const handleCurrencyChange = async (selectedCurrency: string) => {
    try {
      // Get the currency symbol for the selected currency
      const symbol = currencyOptions.find(c => c.code === selectedCurrency)?.symbol || "$";
      
      // Update local state
      setCurrency(selectedCurrency);
      setShowCurrencyDialog(false);
      
      // Save the setting using our context
      const success = await updateSettings({ 
        currency: selectedCurrency,
        currencySymbol: symbol
      });
      
      if (!success) {
        throw new Error("Failed to save currency setting");
      }
      
      toast({
        title: "Currency Updated",
        description: `Your currency has been updated to ${symbol} ${selectedCurrency}.`,
      });
    } catch (error) {
      console.error("Error updating currency:", error);
      toast({
        title: "Error",
        description: "Failed to update currency. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleWeekStartChange = async (selectedDay: string) => {
    try {
      // Update local state
      setWeekStartDay(selectedDay);
      setShowWeekStartDialog(false);
      
      // Save the setting using our context
      const success = await updateSettings({ 
        weekStartDay: selectedDay 
      });
      
      if (!success) {
        throw new Error("Failed to save week start day setting");
      }
      
      // Show success message
      toast({
        title: "Week Start Day Updated",
        description: `Your week will now start on ${selectedDay}.`,
      });
    } catch (error) {
      console.error("Error updating week start day:", error);
      toast({
        title: "Error",
        description: "Failed to update week start day. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleNotImplemented = () => {
    toast({
      title: "Feature not implemented",
      description: "This feature is not yet implemented in the current version.",
    });
  };

  // For currency dialog search
  const [searchQuery, setSearchQuery] = React.useState("");
  const filteredCurrencies = searchQuery 
    ? currencyOptions.filter(option => 
        option.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        option.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currencyOptions;

  // Track which section to scroll to
  const [scrollToSection, setScrollToSection] = React.useState<string | null>(null);
  const taxRatesSectionRef = React.useRef<HTMLDivElement>(null);
  const emailUpdatesSectionRef = React.useRef<HTMLDivElement>(null);
  
  // Check for hash in URL and determine which section to scroll to
  useEffect(() => {
    if (window.location.hash === '#tax-rates') {
      setScrollToSection('tax-rates');
    } else if (window.location.hash === '#email-updates') {
      setScrollToSection('email-updates');
    }
  }, []);
  
  // Scroll to the selected section if needed
  useEffect(() => {
    if (scrollToSection === 'tax-rates' && taxRatesSectionRef.current) {
      taxRatesSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      setScrollToSection(null);
    } else if (scrollToSection === 'email-updates' && emailUpdatesSectionRef.current) {
      emailUpdatesSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      setScrollToSection(null);
    }
  }, [scrollToSection, taxRatesSectionRef, emailUpdatesSectionRef]);

  return (
    <div className="p-6">
      <PageHeader title="Settings" />
      
      {/* Currency Selection Dialog */}
      <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Currency</DialogTitle>
            <DialogDescription>
              Choose the currency you would like to use in your BakeGenie account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                className="pl-9"
                placeholder="Search currencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <XIcon className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
            
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {filteredCurrencies.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No currencies match your search
                  </div>
                ) : (
                  filteredCurrencies.map((option) => (
                    <button
                      key={option.code}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 text-left rounded-md transition-colors",
                        currency === option.code 
                          ? "bg-primary-50 text-primary-600 font-medium" 
                          : "hover:bg-gray-100"
                      )}
                      onClick={() => handleCurrencyChange(option.code)}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 w-8 text-center font-medium text-lg">{option.symbol}</span>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.name}</span>
                          <span className="text-sm text-gray-500">{option.code}</span>
                        </div>
                      </div>
                      {currency === option.code && (
                        <CheckIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Week Start Day Dialog */}
      <Dialog open={showWeekStartDialog} onOpenChange={setShowWeekStartDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Week Start Day</DialogTitle>
            <DialogDescription>
              Choose which day of the week you would like to start your calendar week.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {weekStartOptions.map((day) => (
                  <button
                    key={day}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 text-left rounded-md transition-colors",
                      weekStartDay === day 
                        ? "bg-primary-50 text-primary-600 font-medium" 
                        : "hover:bg-gray-100"
                    )}
                    onClick={() => handleWeekStartChange(day)}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-3 h-5 w-5 text-primary-500 opacity-80" />
                      <span className="font-medium">{day}</span>
                    </div>
                    {weekStartDay === day && (
                      <CheckIcon className="h-5 w-5 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mt-6 grid grid-cols-1 gap-6">
        {/* Application Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Application Settings</CardTitle>
            <CardDescription>
              Update the application settings that are applied to your BakeGenie account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-md">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setShowCurrencyDialog(true)}>
                  <div className="flex items-center">
                    <CurrencyIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Currency</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>{currencyOptions.find(c => c.code === currency)?.symbol} {currency}</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <Separator />
                
                <Link href="/tax-rates">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center">
                      <PercentIcon className="mr-3 h-5 w-5 text-primary-500" />
                      <span>Tax Rates</span>
                    </div>
                    <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                  </div>
                </Link>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={() => window.location.hash = "email-updates"}>
                  <div className="flex items-center">
                    <MailIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Email Updates</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <SettingsIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Manage Features</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setShowWeekStartDialog(true)}>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Week Start Day</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>{weekStartDay}</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <GlobeIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Language</span>
                  </div>
                  <div className="text-gray-600">
                    <span>{language}</span>
                  </div>
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <TypeIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Version</span>
                  </div>
                  <div className="text-gray-600">
                    <span>2.2.3</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Orders, Quotes & Invoices Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Orders, Quotes & Invoices</CardTitle>
            <CardDescription>
              Customize your products and events. Set your hourly rate, automatic markup margin percentage and update your Terms & Conditions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-md">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <LayersIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Event Types</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>11 items</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <PizzaIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Product Types</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>14 items</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <LayersIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Customize your Products</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <ClockIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Hourly Rate</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>${hourlyRate}/h</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <PercentIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Markup Margin %</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>{markupMargin}%</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <TypeIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Next Order Number</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>26</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <MapPinIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Default Collection Address</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <FileTextIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Order Terms & Conditions</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <NotebookIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Order Footer</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <MailIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Email Template</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <TypeIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Job Sheet & Invoice Font Size</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>Normal</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Enquiry Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Enquiry Form</CardTitle>
            <CardDescription>
              Setup your Online Enquiry Form making it easier for customers to contact you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-md">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <SettingsIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Manage Enquiry Form</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Receive Payments & Integration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Receive Payments & Integration</CardTitle>
            <CardDescription>
              Add a Payment Provider to allow your customers to pay through BakeGenie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-md">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <CreditCardIcon className="mr-3 h-5 w-5 text-gray-800" />
                    <span>Stripe Payments</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <CreditCardIcon className="mr-3 h-5 w-5 text-gray-800" />
                    <span>Square Payments</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <DollarSignIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Setup Tipping</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recipes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recipes</CardTitle>
            <CardDescription>
              Manage your categories under your recipes section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-md">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <FolderIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Recipe Categories</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Business & Expenses Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Business & Expenses</CardTitle>
            <CardDescription>
              Manage your categories under your expenses and income section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-md">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <FolderIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Expense Categories</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <FolderIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Additional Income Categories</span>
                  </div>
                  <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-600" />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={handleNotImplemented}>
                  <div className="flex items-center">
                    <RulerIcon className="mr-3 h-5 w-5 text-primary-500" />
                    <span>Distance Units</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span>km</span>
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tax Rates link */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tax Rates</CardTitle>
            <CardDescription>Configure tax rates and settings for your business</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tax-rates" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-md border transition-colors">
              <div className="flex items-center">
                <PercentIcon className="mr-3 h-5 w-5 text-primary-500" />
                <span>Manage Tax Rates</span>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </Link>
          </CardContent>
        </Card>

        {/* Email Updates Section */}
        <div id="email-updates" ref={emailUpdatesSectionRef} className="mt-6">
          <EmailUpdatesSection />
        </div>
      </div>
    </div>
  );
};

export default Settings;