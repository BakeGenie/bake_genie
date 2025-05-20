import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeftIcon } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/settings-context";
import PageHeader from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

// Default template texts
const defaultTemplates = {
  quoteTemplate: `Hi

Please find your quote attached.

If you have any trouble viewing it, please contact us.

Thanks again`,

  invoiceTemplate: `Hi

Please find your invoice attached.

To make an online payment for your order, please click on the link below. If you have any trouble viewing it, please contact us.

Thanks again`,

  paymentReminderTemplate: `Hi

This is a friendly reminder that there is a scheduled payment due for your order.

I'd appreciate it if you could make the payment as soon as possible. If you have any questions or concerns please feel free to contact me.

Thanks again`,

  paymentReceiptTemplate: `Hi

Please find your payment receipt attached.

Thank you for your business. If you have any questions or concerns please feel free to contact me.

Thanks again`,

  enquiryMessageTemplate: `Hi

We're reviewing your enquiry, and we'll contact you as soon as possible.

Thank you for your business. If you have any questions or concerns please feel free to contact me.

Thanks again`
};

export default function EmailTemplates() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();

  // Template states
  const [quoteTemplate, setQuoteTemplate] = useState("");
  const [invoiceTemplate, setInvoiceTemplate] = useState("");
  const [paymentReminderTemplate, setPaymentReminderTemplate] = useState("");
  const [paymentReceiptTemplate, setPaymentReceiptTemplate] = useState("");
  const [enquiryMessageTemplate, setEnquiryMessageTemplate] = useState("");
  
  // Loading and change tracking
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize templates from settings or defaults
  useEffect(() => {
    if (settings) {
      setQuoteTemplate(settings.quoteEmailTemplate || defaultTemplates.quoteTemplate);
      setInvoiceTemplate(settings.invoiceEmailTemplate || defaultTemplates.invoiceTemplate);
      setPaymentReminderTemplate(settings.paymentReminderTemplate || defaultTemplates.paymentReminderTemplate);
      setPaymentReceiptTemplate(settings.paymentReceiptTemplate || defaultTemplates.paymentReceiptTemplate);
      setEnquiryMessageTemplate(settings.enquiryMessageTemplate || defaultTemplates.enquiryMessageTemplate);
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (settings) {
      const hasQuoteChanged = settings.quoteEmailTemplate !== quoteTemplate;
      const hasInvoiceChanged = settings.invoiceEmailTemplate !== invoiceTemplate;
      const hasReminderChanged = settings.paymentReminderTemplate !== paymentReminderTemplate;
      const hasReceiptChanged = settings.paymentReceiptTemplate !== paymentReceiptTemplate;
      const hasEnquiryChanged = settings.enquiryMessageTemplate !== enquiryMessageTemplate;
      
      setHasChanges(
        hasQuoteChanged || 
        hasInvoiceChanged || 
        hasReminderChanged || 
        hasReceiptChanged || 
        hasEnquiryChanged
      );
    }
  }, [
    settings, 
    quoteTemplate, 
    invoiceTemplate, 
    paymentReminderTemplate, 
    paymentReceiptTemplate, 
    enquiryMessageTemplate
  ]);

  // Mutation for saving changes
  const saveTemplatesMutation = useMutation({
    mutationFn: async (data: Partial<typeof settings>) => {
      setIsLoading(true);
      const response = await apiRequest("PATCH", "/api/settings", data);
      const result = await response.json();
      setIsLoading(false);
      return result;
    },
    onSuccess: (data) => {
      updateSettings(data);
      setHasChanges(false);
      toast({
        title: "Templates saved",
        description: "Your email templates have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error saving templates:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your email templates. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveChanges = () => {
    saveTemplatesMutation.mutate({
      quoteEmailTemplate: quoteTemplate,
      invoiceEmailTemplate: invoiceTemplate,
      paymentReminderTemplate: paymentReminderTemplate,
      paymentReceiptTemplate: paymentReceiptTemplate,
      enquiryMessageTemplate: enquiryMessageTemplate
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/settings" className="mr-4">
          <Button variant="ghost" size="icon">
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader heading="Email Templates" text="Customize your email message templates" />
      </div>

      <div className="flex justify-between mb-6">
        <p className="text-sm text-gray-500">
          These templates will be used as the default text when sending emails from the system.
          You will be able to edit the content before sending each email.
        </p>
        <Button 
          onClick={handleSaveChanges} 
          disabled={!hasChanges || isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Quote Template */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quote Template</CardTitle>
          <CardDescription>
            Add your default text to be used when sending out a quote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[200px]"
            placeholder="Enter your quote email template"
            value={quoteTemplate}
            onChange={(e) => setQuoteTemplate(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-2">
            * You will be able to adjust the text before sending an email out.
          </p>
        </CardContent>
      </Card>

      {/* Invoice Template */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Invoice Template</CardTitle>
          <CardDescription>
            Add your default text to be used when sending out an invoice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[200px]"
            placeholder="Enter your invoice email template"
            value={invoiceTemplate}
            onChange={(e) => setInvoiceTemplate(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-2">
            * You will be able to adjust the text before sending an email out.
          </p>
        </CardContent>
      </Card>

      {/* Payment Reminder Template */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Reminder Template</CardTitle>
          <CardDescription>
            Add your default text to be used when sending out a scheduled payment reminder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[200px]"
            placeholder="Enter your payment reminder template"
            value={paymentReminderTemplate}
            onChange={(e) => setPaymentReminderTemplate(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-2">
            * You will be able to adjust the text before sending an email out.
          </p>
        </CardContent>
      </Card>

      {/* Payment Receipt Template */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Receipt Template</CardTitle>
          <CardDescription>
            Add your default text to be used when sending out a payment receipt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[200px]"
            placeholder="Enter your payment receipt template"
            value={paymentReceiptTemplate}
            onChange={(e) => setPaymentReceiptTemplate(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-2">
            * You will be able to adjust the text before sending an email out.
          </p>
        </CardContent>
      </Card>

      {/* Enquiry Message Template */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enquiry Message Template</CardTitle>
          <CardDescription>
            Add your default text to be used when sending a message reply for an enquiry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[200px]"
            placeholder="Enter your enquiry message template"
            value={enquiryMessageTemplate}
            onChange={(e) => setEnquiryMessageTemplate(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-2">
            * You will be able to adjust the text before sending an email out.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-10">
        <Button 
          onClick={handleSaveChanges} 
          disabled={!hasChanges || isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}