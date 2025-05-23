import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileUp, Upload, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ContactsImport = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);

  // Fetch existing contacts
  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.toLowerCase().endsWith(".csv")) {
        setFile(selectedFile);
        toast({
          title: "File selected",
          description: `${selectedFile.name} (${(
            selectedFile.size / 1024
          ).toFixed(1)} KB)`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.name.toLowerCase().endsWith(".csv")) {
        setFile(droppedFile);
        toast({
          title: "File dropped",
          description: `${droppedFile.name} (${(
            droppedFile.size / 1024
          ).toFixed(1)} KB)`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please drop a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setImportProgress(10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "contacts");

    try {
      setImportProgress(30);
      
      const response = await fetch("/api/data/import", {
        method: "POST",
        body: formData,
      });
      
      setImportProgress(70);
      
      const result = await response.json();
      
      setImportProgress(100);
      setImportResult(result);
      
      if (result.success) {
        toast({
          title: "Import successful",
          description: result.message,
        });
        // Refetch contacts after successful import
        refetch();
      } else {
        toast({
          title: "Import issues",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing your contacts",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/data")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Import Bake Diary Contacts</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                <span>Select File to Import</span>
              </CardTitle>
              <CardDescription>
                Upload a CSV file exported from Bake Diary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  file ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-8 w-8 text-primary" />
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                    <div className="font-medium">Click to upload or drag and drop</div>
                    <div className="text-sm text-muted-foreground">
                      CSV file (max 10MB)
                    </div>
                  </div>
                )}
              </div>
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing contacts...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4 mr-2" />
                    CSV Format
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Bake Diary CSV Format</h4>
                    <p className="text-sm">
                      Your CSV should have these headers:
                    </p>
                    <code className="text-xs bg-muted p-1 rounded block">
                      Type, First Name, Last Name, Supplier Name, Email, Number, Allow Marketing, Website, Source
                    </code>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <Button
                onClick={handleImport}
                disabled={!file || isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </Button>
            </CardFooter>
          </Card>

          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle>Import Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={importResult.success ? "text-green-500" : "text-red-500"}>
                      {importResult.success ? "Success" : "Completed with issues"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contacts imported:</span>
                    <span>{importResult.details?.imported || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contacts skipped:</span>
                    <span>{importResult.details?.skipped || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span>{importResult.details?.errors || 0}</span>
                  </div>
                </div>
                {importResult.details?.errorDetails?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Error Details:</h4>
                    <div className="max-h-40 overflow-y-auto text-sm bg-muted p-2 rounded">
                      {importResult.details.errorDetails.map((error: string, index: number) => (
                        <div key={index} className="mb-1">• {error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Contacts</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading contacts..."
                  : `${contacts.length} contacts in your account`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : contacts.length > 0 ? (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Business</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact: any) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </TableCell>
                          <TableCell>{contact.email || "-"}</TableCell>
                          <TableCell>{contact.phone || "-"}</TableCell>
                          <TableCell>{contact.businessName || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No contacts found</p>
                  <p className="text-sm mt-2">
                    Import contacts or add them manually
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="ml-auto"
              >
                <Link href="/contacts">View All Contacts</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactsImport;