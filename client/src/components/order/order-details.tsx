import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import OrderLog from "./order-log";
import { Link } from "wouter";
import EmailInvoiceButton from "./email-invoice-button";
import PaymentReminderSettings from "./payment-reminder-settings";
import { FormatCurrency } from "@/components/ui/format-currency";

interface OrderDetailsProps {
  order: OrderWithItems;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  // Create a badge for the event type
  const getEventTypeBadge = () => {
    switch (order.eventType) {
      case "Birthday":
        return <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>{order.eventType}</span>;
      case "Wedding":
        return <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-pink-500"></span>{order.eventType}</span>;
      case "Corporate":
        return <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>{order.eventType}</span>;
      case "Anniversary":
        return <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>{order.eventType}</span>;
      default:
        return <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-gray-500"></span>{order.eventType}</span>;
    }
  };

  // Create a badge for the status
  const getStatusBadge = () => {
    switch (order.status) {
      case "Quote":
        return <Badge variant="outline">Quote</Badge>;
      case "Confirmed":
        return <Badge variant="secondary">Confirmed</Badge>;
      case "Paid":
        return <Badge variant="default">Paid</Badge>;
      case "Ready":
        return <Badge className="bg-green-500 hover:bg-green-600">Ready</Badge>;
      case "Delivered":
        return <Badge className="bg-green-500 hover:bg-green-600">Delivered</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Event Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm text-gray-500">Order #:</div>
            <div className="col-span-2 text-sm">{order.orderNumber}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm text-gray-500">Type:</div>
            <div className="col-span-2 text-sm">
              {order.orderNumber.startsWith("Q") ? "Quote" : "Order"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm text-gray-500">Customer:</div>
            <div className="col-span-2 text-sm">
              <Link href={`/contacts/${order.contactId}`}>
                <a className="text-primary-600 hover:text-primary-700 cursor-pointer">
                  {order.contact?.firstName} {order.contact?.lastName}
                  {order.contact?.company && ` c/o ${order.contact.company}`}
                </a>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm text-gray-500">Date:</div>
            <div className="col-span-2 text-sm">
              {formatDate(new Date(order.eventDate), { dayOfWeek: true })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm text-gray-500">Event:</div>
            <div className="col-span-2 text-sm">{getEventTypeBadge()}</div>
          </div>
          {order.theme && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm text-gray-500">Theme:</div>
              <div className="col-span-2 text-sm">{order.theme}</div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm text-gray-500">Status:</div>
            <div className="col-span-2">{getStatusBadge()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery/Collection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery / Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm text-gray-500">Order to be:</div>
            <div className="col-span-2 text-sm">
              {order.deliveryType === "Pickup" ? "Collected" : "Delivered"}{" "}
              {order.deliveryDetails && `- ${order.deliveryDetails}`}
            </div>
          </div>
          {order.imageUrls && order.imageUrls.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-2">Image Uploads</div>
              <div className="grid grid-cols-2 gap-2">
                {order.imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden h-32"
                  >
                    <img
                      src={url}
                      alt={`Order image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between pb-4 border-b border-gray-100"
              >
                <div>
                  <div className="text-primary-600 hover:text-primary-700 cursor-pointer text-sm mb-1">
                    {item.type}
                  </div>
                  <div className="text-sm">
                    {item.quantity} x {item.name}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-500">{item.description}</div>
                  )}
                  {item.notes && (
                    <div className="text-sm text-gray-500">{item.notes}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    <FormatCurrency amount={item.price} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-right text-gray-500">Subtotal:</div>
            <div className="text-right font-medium">
              <FormatCurrency amount={(Number(order.total) - Number(order.setupFee || 0) + Number(order.discount || 0))} />
            </div>
            <div className="text-right text-gray-500">Discount:</div>
            <div className="text-right font-medium text-red-600">
              - <FormatCurrency amount={order.discount || 0} />
            </div>
            <div className="text-right text-gray-500">Setup / Delivery:</div>
            <div className="text-right font-medium">
              <FormatCurrency amount={order.setupFee || 0} />
            </div>
          </div>
        </div>
        <CardFooter className="border-t border-gray-200 px-6 py-3">
          <div className="grid grid-cols-2 gap-2 text-sm w-full">
            <div className="text-right text-gray-700 font-medium">Total:</div>
            <div className="text-right font-semibold text-lg">
              <FormatCurrency amount={order.total} />
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Order Log and Payment Reminders */}
      <div className="md:col-span-2 space-y-4">
        <OrderLog logs={order.logs || []} orderId={order.id} />
        
        {/* Payment Reminder Settings */}
        <PaymentReminderSettings 
          orderId={order.id}
          dueDate={order.dueDate}
          contactEmail={order.contact?.email}
          orderStatus={order.status}
        />
      </div>
    </div>
  );
};

export default OrderDetails;
