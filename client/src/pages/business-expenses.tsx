import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const BusinessExpenses = () => {
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto p-4 mb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Business & Expenses</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Track Expenses Card */}
        <Card className="bg-white shadow-sm border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" className="transform -rotate-12 text-blue-100 fill-current">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" className="absolute top-1 left-1 transform -rotate-8 text-blue-200 fill-current">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" className="absolute top-2 left-2 transform -rotate-4 text-blue-300 fill-current">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                  <Plus size={18} />
                </div>
              </div>
              <CardTitle className="text-lg font-semibold mb-2">Track Expenses</CardTitle>
              <p className="text-sm text-gray-500">
                Track and enter in all your receipts for your business purchases.
              </p>
              <Button 
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => navigate("/expenses")}
              >
                View Expenses
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Income Card */}
        <Card className="bg-white shadow-sm border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" className="text-amber-100 fill-current">
                    <path d="M19 5h-2V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2H5c-1.1 0-2 .9-2 2v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7c0-1.1-.9-2-2-2zm-9-2h4v2h-4V3zm0 14v-3H5v-2h5V9.5a2.5 2.5 0 0 1 5 0V12h2v2h-2v3h-5z" />
                  </svg>
                  <div className="absolute -top-2 right-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" className="text-teal-400 fill-current">
                      <circle cx="12" cy="12" r="12" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 right-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" className="text-teal-300 fill-current">
                      <circle cx="12" cy="12" r="12" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                  <Plus size={18} />
                </div>
              </div>
              <CardTitle className="text-lg font-semibold mb-2">Additional Income</CardTitle>
              <p className="text-sm text-gray-500">
                Track and record any additional income for your business.
              </p>
              <Button 
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => navigate("/income")}
              >
                View Income
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Track Mileage Card */}
        <Card className="bg-white shadow-sm border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 relative flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="90%" viewBox="0 0 24 24" className="text-gray-400 fill-current">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                  <Plus size={18} />
                </div>
              </div>
              <CardTitle className="text-lg font-semibold mb-2">Track Mileage</CardTitle>
              <p className="text-sm text-gray-500">
                Add in all your mileage that is associated with your business.
              </p>
              <Button 
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => navigate("/mileage")}
              >
                View Mileage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 flex justify-center">
        <div className="opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0.5 0.5 80 30" fill="none">
            <path d="M30.617 1.062a.586.586 0 0 0-.574.479l-2.3 9.921c-.198.79.475 1.497 1.267 1.316l11.115-2.584 3.27 8.698a.9.9 0 0 0 1.212.461l2.075-.909a.902.902 0 0 0 .412-1.236l-3.163-8.209 7.655-1.778c.746-.173 1.039-1.093.536-1.671L42.93 1.061a.586.586 0 0 0-.445-.167l-11.87 0z" fill="#c1c1c1" />
            <path d="M56.633 29.733a.586.586 0 0 0 .649-.371l3.476-9.56c.299-.761-.274-1.523-1.081-1.434l-11.319 1.243-1.94-9.049a.9.9 0 0 0-1.119-.67l-2.14.672a.902.902 0 0 0-.592 1.161l1.876 8.566-7.795.855c-.76.083-1.188.948-.784 1.586l8.197 13.001a.586.586 0 0 0 .47.223l11.102-.224z" fill="#c1c1c1" />
          </svg>
          <div className="text-xs text-gray-500 text-center mt-1">BakeDiary</div>
        </div>
      </div>
    </div>
  );
};

export default BusinessExpenses;