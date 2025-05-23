import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function ContactsImport() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [contacts, setContacts] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch existing contacts on load
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  // Handle import file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setImportFile(file);
      setImportSuccess(null);
      setImportMessage("");
      setImportError("");
    }
  };

  // Handle CSV import
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportSuccess(null);
    setImportMessage("");
    setImportError("");
    setImportProgress(10); // Start progress

    try {
      // Show initial progress
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => {
          const next = prev + 5;
          return next < 90 ? next : prev;
        });
      }, 500);

      const formData = new FormData();
      formData.append("file", importFile);

      const response = await fetch("/api/data/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setImportProgress(95);

      const result = await response.json();

      if (result.success) {
        setImportSuccess(true);
        setImportMessage(result.message || "Contacts imported successfully!");
        setImportProgress(100);
        
        toast({
          title: "Import Successful",
          description: `Successfully imported contacts from ${importFile.name}`,
        });
        
        // Refresh contacts list
        fetchContacts();
      } else {
        setImportSuccess(false);
        setImportError(result.error || "Unknown error occurred");
        setImportProgress(0);
        
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import contacts",
          variant: "destructive",
        });
      }
    } catch (error) {
      setImportSuccess(false);
      setImportError(error instanceof Error ? error.message : "An error occurred during import");
      setImportProgress(0);
      
      toast({
        title: "Import Failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Bake Diary Contacts Import</h1>
          <p className="text-muted-foreground">
            Import your contacts from Bake Diary CSV export
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Upload className="h-5 w-5" />
              Import Bake Diary Contacts
            </CardTitle>
            <CardDescription>
              Upload your CSV file exported from Bake Diary to import your contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="importFile" className="text-base font-medium">Select CSV File to Import</Label>
                <div className="border-2 border-dashed border-purple-200 dark:border-purple-800/40 rounded-md p-6 text-center hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer">
                  <input
                    id="importFile"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="importFile" className="cursor-pointer block">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-purple-400" />
                      {importFile ? (
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Click to browse or drag and drop a CSV file
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Supported format: Bake Diary Contacts CSV
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {importFile && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-medium mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Ready to Import</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    This will import all contacts from your Bake Diary export file. The system will automatically map fields like first name, last name, email, phone, etc.
                  </p>
                </div>
              )}

              {importProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Importing contacts...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}

              {importSuccess === true && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-400">Import Successful</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-500">
                    {importMessage}
                  </AlertDescription>
                </Alert>
              )}

              {importSuccess === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Failed</AlertTitle>
                  <AlertDescription>
                    {importError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-slate-50 dark:bg-slate-900/50 py-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setImportFile(null);
                setImportSuccess(null);
                setImportMessage("");
                setImportError("");
                setImportProgress(0);
              }}
              disabled={isImporting}
            >
              Clear
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={!importFile || isImporting}
              className="relative"
            >
              {isImporting ? (
                <>
                  <span className="opacity-0">Import Contacts</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    Importing...
                  </span>
                </>
              ) : (
                <>
                  Import Contacts
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Contacts ({contacts.length})</CardTitle>
            <CardDescription>
              View your existing contact list
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No contacts found. Import some contacts to get started!
              </div>
            ) : (
              <div className="overflow-auto max-h-[400px] border rounded-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {contact.firstName} {contact.lastName}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {contact.email || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {contact.phone || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-slate-50 dark:bg-slate-900/50 py-4">
            <Button variant="outline" onClick={fetchContacts}>
              Refresh Contacts List
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}