import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, CreditCard, ExternalLink } from "lucide-react";
import { SiStripe, SiSquare } from "react-icons/si";

export default function PaymentSettings() {
  const [_, setLocation] = useLocation();

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center border-b bg-white p-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => setLocation("/settings")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Payment Settings</span>
        </Button>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Payment Providers</h1>
          <p className="text-gray-600">
            Choose and configure your preferred payment provider to collect payments from your customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stripe Card */}
          <Card className="overflow-hidden border border-gray-200 hover:border-blue-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Stripe</CardTitle>
                <SiStripe className="h-8 w-8 text-white" />
              </div>
              <CardDescription className="text-blue-100 mt-2">
                Process payments with Stripe's secure payment platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Accept credit cards, digital wallets, and more</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Available in 46+ countries worldwide</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>2.9% + 30¢ per successful card charge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Automated payouts to your bank account</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t flex justify-between items-center p-4">
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setLocation("/payment-settings/stripe")}
              >
                Configure
              </Button>
              <a 
                href="https://stripe.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
              >
                Learn more
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </CardFooter>
          </Card>

          {/* Square Card */}
          <Card className="overflow-hidden border border-gray-200 hover:border-gray-700 transition-all duration-200 hover:shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Square</CardTitle>
                <SiSquare className="h-8 w-8 text-white" />
              </div>
              <CardDescription className="text-gray-300 mt-2">
                Process payments through Square's payment platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Accept all major credit and debit cards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Available in United States, Canada, Japan, Australia, and UK</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>2.6% + 10¢ per tapped, dipped, or swiped transaction</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Fast deposits and flexible payout options</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t flex justify-between items-center p-4">
              <Button 
                className="bg-gray-900 hover:bg-black text-white"
                onClick={() => setLocation("/payment-settings/square")}
              >
                Configure
              </Button>
              <a 
                href="https://squareup.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 text-sm flex items-center"
              >
                Learn more
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </CardFooter>
          </Card>
        </div>

        {/* Additional Payment Settings */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Additional Payment Settings</h2>
          <Card className="overflow-hidden border border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <CardTitle className="text-lg">Tipping Options</CardTitle>
              </div>
              <CardDescription>
                Configure tipping options for your customers during checkout
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end bg-gray-50 border-t p-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/payment-settings/tipping")}
              >
                Configure Tipping
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}