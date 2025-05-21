import React from "react";
import { useLocation } from "wouter";
import { ChevronRightIcon } from "lucide-react";

export default function PaymentSettings() {
  const [_, setLocation] = useLocation();

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Left Panel */}
        <div className="md:w-1/4 p-5 bg-gray-50 rounded-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Receive Payments & Integration</h2>
          <p className="text-gray-600 text-sm">
            Add a Payment Provider to allow your customers to pay through BakeGenie.
          </p>
        </div>

        {/* Right Panel */}
        <div className="md:w-3/4 bg-white rounded-md shadow-sm border">
          {/* Stripe Payments */}
          <div 
            onClick={() => setLocation("/payment-settings/stripe")}
            className="p-4 flex justify-between items-center border-b cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white w-6 h-6 rounded-sm flex items-center justify-center">
                <span className="font-bold text-sm">S</span>
              </div>
              <span className="font-medium">Stripe Payments</span>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>

          {/* Square Payments */}
          <div 
            onClick={() => setLocation("/payment-settings/square")}
            className="p-4 flex justify-between items-center border-b cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="bg-black text-white w-6 h-6 rounded-sm flex items-center justify-center">
                <span className="font-bold text-sm">□</span>
              </div>
              <span className="font-medium">Square Payments</span>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>

          {/* Setup Tipping */}
          <div 
            onClick={() => setLocation("/payment-settings/tipping")}
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-500 text-white w-6 h-6 rounded-sm flex items-center justify-center">
                <span className="font-bold text-sm">$</span>
              </div>
              <span className="font-medium">Setup Tipping</span>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}