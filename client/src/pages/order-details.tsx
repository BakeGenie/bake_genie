import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { ChevronLeftIcon, UploadIcon, DownloadIcon, CalendarIcon, InfoIcon, PlusIcon } from "lucide-react";
import { FormatCurrency } from "@/components/ui/format-currency";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const OrderDetails: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("details");

  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["/api/orders", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <InfoIcon className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold">Error Loading Order</h1>
        <p className="text-gray-600">Unable to load order details</p>
        <Button onClick={() => setLocation("/orders")}>Return to Orders</Button>
      </div>
    );
  }

  // Function to format date
  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'EEE, dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case "quote":
        return <Badge variant="secondary">Quote</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isQuote = order.status === 'Quote' || (order.orderNumber && order.orderNumber.startsWith("Q"));
  const orderPrefix = isQuote ? 'Quote' : 'Order';
  const orderNum = isQuote ? order.orderNumber?.replace(/^Q/, '') : order.orderNumber;

  // Calculate totals
  const subtotal = order.items?.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.price) * (item.quantity || 1)), 0) || 0;
  
  const discount = parseFloat(order.discount) || 0;
  const discountType = order.discountType || '%';
  const discountAmount = discountType === '%' ? (subtotal * discount / 100) : discount;
  
  const setupFee = parseFloat(order.setupFee) || 0;
  const deliveryFee = parseFloat(order.deliveryFee) || 0;
  const taxRate = parseFloat(order.taxRate) || 0;
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  
  const totalAmount = subtotal - discountAmount + setupFee + deliveryFee + taxAmount;

  return (
    <div className="container mx-auto py-4 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/orders")}
          className="mr-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button size="sm">
            Email Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{orderPrefix} #:</span>
                <span className="text-sm font-medium">{orderNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type:</span>
                <span className="text-sm font-medium">{isQuote ? 'Quote' : order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Customer:</span>
                <span className="text-sm font-medium text-blue-600">
                  {order.contact?.firstName} {order.contact?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Date:</span>
                <span className="text-sm font-medium">{formatDate(order.eventDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Event:</span>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  <span className="text-sm font-medium">{order.eventType}</span>
                </div>
              </div>
              {order.theme && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Theme:</span>
                  <span className="text-sm font-medium">{order.theme}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span>{getStatusBadge(order.status)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Delivery / Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Order to be:</span>
                <span className="text-sm font-medium">{order.deliveryType || 'Pickup'}</span>
              </div>
              {order.deliveryType === 'Delivery' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Delivery Address:</span>
                    <span className="text-sm font-medium">{order.deliveryAddress}</span>
                  </div>
                  {order.deliveryTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Delivery Time:</span>
                      <span className="text-sm font-medium">{order.deliveryTime}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Image Uploads:</span>
                <Button variant="ghost" size="sm" className="h-8 px-2 py-1">
                  <UploadIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">Add Images</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items Section */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle>{isQuote ? 'Quote' : 'Order'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="pb-4 border-b border-gray-200 last:border-0">
                <div className="flex justify-between mb-1">
                  <div className="font-medium">{item.name || item.description} - <span className="text-gray-500">×{item.quantity || 1}</span></div>
                  <div className="font-medium">
                    <FormatCurrency amount={(parseFloat(item.price) * (item.quantity || 1))} />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {item.description && item.name && item.name !== item.description ? item.description : ''}
                </div>
                {item.special_instructions && (
                  <div className="text-sm text-gray-600 mt-1">
                    Design Details: {item.special_instructions}
                  </div>
                )}
              </div>
            ))}

            {/* Order Totals */}
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <FormatCurrency amount={subtotal} />
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount:</span>
                  <span className="text-red-500">-<FormatCurrency amount={discountAmount} /></span>
                </div>
              )}
              
              {setupFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Setup / Delivery:</span>
                  <FormatCurrency amount={setupFee} />
                </div>
              )}
              
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax on Setup:</span>
                  <FormatCurrency amount={taxAmount} />
                </div>
              )}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <FormatCurrency amount={order.total_amount || totalAmount} />
              </div>
              
              {/* Profit Section */}
              <div className="mt-4 bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Gross Profit:</span>
                  <span className="text-sm font-medium text-green-600">
                    <FormatCurrency amount={(order.total_amount || totalAmount) * 0.3} />
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  (*) Your profit amount is not included in any print-outs or PDFs.
                  <br />
                  <a href="#" className="text-blue-500 hover:underline">How is this calculated?</a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <div>
          {isQuote && (
            <Button variant="outline" className="mr-2">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Email Quote
            </Button>
          )}
        </div>
        <div>
          {isQuote && (
            <Button className="ml-2">
              Convert to Order
            </Button>
          )}
        </div>
      </div>

      {/* Additional Information Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="payments">Scheduled Payments</TabsTrigger>
            <TabsTrigger value="info">General Information</TabsTrigger>
            <TabsTrigger value="jobsheet">Job Sheet Details</TabsTrigger>
            <TabsTrigger value="tasks">Order Tasks</TabsTrigger>
            <TabsTrigger value="log">Order Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <InfoIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <p>You have no scheduled payments for this order</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="info">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{order.contact?.firstName} {order.contact?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{order.contact?.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{order.contact?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{order.contact?.address || '-'}</p>
                    </div>
                  </div>
                  
                  {order.notes && (
                    <>
                      <h3 className="font-medium mt-6">Order Notes</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm">{order.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="jobsheet">
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <h3 className="font-medium">Job Sheet</h3>
                <Button variant="outline">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Job Sheet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Tasks</h3>
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <InfoIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <p>You have no tasks created for this order</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="log">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Order Log</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Call the API to add a note
                      const action = "Note Added";
                      const details = prompt("Enter note details");
                      if (details) {
                        fetch(`/api/orders/${id}/logs`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action, details })
                        })
                        .then(res => {
                          if (res.ok) {
                            toast({
                              title: "Note added",
                              description: "Your note has been added to the order log",
                            });
                            // Refresh logs
                            refetchLogs();
                          }
                        });
                      }
                    }}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                </div>
                
                {/* Fetch the actual logs from the database */}
                <OrderLogHistory orderId={id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrderDetails;