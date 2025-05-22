import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Filter,
  Plus,
  Car,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";

// Define the mileage types
type Mileage = {
  id: number;
  userId: number;
  date: string;
  startLocation: string;
  endLocation: string;
  purpose: string;
  miles: number;
  round_trip: boolean;
  notes: string | null;
  createdAt: string;
};

// Form schema for mileage
const mileageFormSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  startLocation: z.string().min(1, "Start location is required"),
  endLocation: z.string().min(1, "End location is required"),
  purpose: z.string().min(1, "Purpose is required"),
  miles: z.coerce.number().min(0.1, "Miles must be greater than 0"),
  round_trip: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

// Purpose options
const purposeOptions = [
  "Delivery",
  "Pick-up supplies",
  "Client meeting",
  "Event",
  "Business errand",
  "Other"
];

const Mileage = () => {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMMM"));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), "yyyy"));
  const [openMileageDialog, setOpenMileageDialog] = useState(false);

  // Form for adding new mileage
  const mileageForm = useForm({
    resolver: zodResolver(mileageFormSchema),
    defaultValues: {
      date: new Date(),
      startLocation: "",
      endLocation: "",
      purpose: purposeOptions[0],
      miles: 0,
      round_trip: false,
      notes: "",
    },
  });

  // Query for fetching mileage data from our API
  const { data: mileageData, isLoading } = useQuery({
    queryKey: ["/api/mileage"],
  });

  // Mutation for creating new mileage
  const createMileageMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("/api/mileage", {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mileage"] });
      setOpenMileageDialog(false);
      mileageForm.reset();
      toast({
        title: "Mileage Added",
        description: "The mileage record has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "There was an error adding the mileage record.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting mileage
  const deleteMileageMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/mileage/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mileage"] });
      toast({
        title: "Mileage Deleted",
        description: "The mileage record has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "There was an error adding the mileage record.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for new mileage
  const onSubmitMileage = (data: any) => {
    const formattedData = {
      ...data,
      date: format(data.date, "yyyy-MM-dd"),
      miles: String(data.miles), // Convert miles to string for API
      userId: 1, // Replace with actual user ID
    };
    createMileageMutation.mutate(formattedData);
  };

  // Get month and year options
  const getMonthOptions = () => {
    return [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [
      String(currentYear - 2),
      String(currentYear - 1),
      String(currentYear),
      String(currentYear + 1),
    ];
  };

  return (
    <div className="container mx-auto p-4 mb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/business-expenses">
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold ml-2">Track Mileage</h1>
        </div>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => setOpenMileageDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Mileage
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <span className="mr-2">Mileage Period:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32 mr-2">
                <SelectValue>{selectedMonth}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue>{selectedYear}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" /> All Purposes
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0">
                <div className="p-2">
                  {purposeOptions.map((purpose) => (
                    <div key={purpose} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                      {purpose}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (!mileageData || mileageData.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-10 text-gray-500">
            <div className="rounded-full bg-gray-100 p-3 mb-2">
              <Car className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-center">You have no mileage records for this period</p>
            <p className="text-center text-sm mt-1">
              Start tracking your business miles by clicking "Add Mileage"
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-medium mb-2">
              {selectedMonth} {selectedYear}
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Miles</TableHead>
                  <TableHead>Round Trip</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mileageData.map((record: Mileage) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{record.startLocation}</TableCell>
                    <TableCell>{record.endLocation}</TableCell>
                    <TableCell>{record.purpose}</TableCell>
                    <TableCell>{record.miles}</TableCell>
                    <TableCell>{record.round_trip ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => deleteMileageMutation.mutate(record.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 pt-2 border-t">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Miles:</div>
                <div className="text-xl font-bold">
                  {mileageData
                    .reduce((total: number, record: Mileage) => total + record.miles, 0)
                    .toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mileage Dialog */}
      <Dialog open={openMileageDialog} onOpenChange={setOpenMileageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Mileage</DialogTitle>
            <DialogDescription>
              Record your business-related travel. Fill out the details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...mileageForm}>
            <form onSubmit={mileageForm.handleSubmit(onSubmitMileage)} className="space-y-4">
              <FormField
                control={mileageForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        value={field.value ? format(field.value, "EEE, dd MMM yyyy") : ""}
                        onClick={() => document.getElementById("mileage-calendar-toggle")?.click()}
                        readOnly
                      />
                    </FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="mileage-calendar-toggle" type="button" variant="outline" className="hidden">
                          Open
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={mileageForm.control}
                  name="startLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Location</FormLabel>
                      <FormControl>
                        <Input placeholder="From" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={mileageForm.control}
                  name="endLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Location</FormLabel>
                      <FormControl>
                        <Input placeholder="To" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={mileageForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purposeOptions.map((purpose) => (
                          <SelectItem key={purpose} value={purpose}>
                            {purpose}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={mileageForm.control}
                name="miles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Miles</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.0"
                        type="number"
                        step="0.1"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={mileageForm.control}
                name="round_trip"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Round Trip</FormLabel>
                      <FormDescription>
                        Check this if the journey was a round trip.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={mileageForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional notes here" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenMileageDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMileageMutation.isPending} className="bg-blue-500">
                  {createMileageMutation.isPending ? "Saving..." : "Add Mileage"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mileage;