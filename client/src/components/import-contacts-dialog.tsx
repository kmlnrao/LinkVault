import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ImportContactsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedContact {
  email: string;
  name?: string;
  phone?: string;
  notes?: string;
}

export function ImportContactsDialog({ isOpen, onClose }: ImportContactsDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [importErrors, setImportErrors] = useState<Array<{row: number, email: string, error: string}>>([]);

  const downloadSampleCSV = () => {
    const csvContent = `Email,Name,Phone,Notes
john.smith@example.com,John Smith,+1-555-0123,Friend from college
sarah.jones@example.com,Sarah Jones,+1-555-0124,Work colleague
mike.wilson@example.com,Mike Wilson,,Family member
emily.davis@example.com,Emily Davis,+1-555-0126,Wants credit card referrals`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "linkvault_sample_contacts.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Sample CSV downloaded",
      description: "Edit this file and upload it to import your contacts",
    });
  };

  const parseCSV = (text: string): ParsedContact[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    if (!headers.includes("email")) {
      throw new Error("CSV must have an 'Email' column");
    }

    const contacts: ParsedContact[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const contact: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          contact[header] = values[index];
        }
      });

      if (contact.email) {
        contacts.push({
          email: contact.email,
          name: contact.name || undefined,
          phone: contact.phone || undefined,
          notes: contact.notes || undefined,
        });
      }
    }

    return contacts;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setImportErrors([]);

    const validTypes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a CSV file",
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const contacts = parseCSV(text);
        setParsedContacts(contacts);
        toast({
          title: "File parsed successfully",
          description: `Found ${contacts.length} valid contacts`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Parse error",
          description: error.message,
        });
        setFile(null);
        setParsedContacts([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/contacts/bulk-import", {
        contacts: parsedContacts,
      });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      if (data.errors && data.errors.length > 0) {
        setImportErrors(data.errors);
        toast({
          variant: "destructive",
          title: "Import completed with errors",
          description: `${data.created || 0} created, ${data.updated || 0} updated, ${data.errors.length} failed`,
        });
      } else {
        toast({
          title: "Import successful",
          description: `${data.created || 0} contacts created, ${data.updated || 0} updated`,
        });
        handleClose();
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Failed to import contacts",
      });
    },
  });

  const handleImport = () => {
    if (parsedContacts.length === 0) {
      toast({
        variant: "destructive",
        title: "No contacts to import",
        description: "Please upload a valid CSV file first",
      });
      return;
    }

    importMutation.mutate();
  };

  const handleClose = () => {
    setFile(null);
    setParsedContacts([]);
    setImportErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-import-contacts">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your contacts. Required column: Email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>CSV File</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload-contacts"
                data-testid="input-csv-file-contacts"
              />
              <label htmlFor="csv-upload-contacts" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  {file ? (
                    <>
                      <FileSpreadsheet className="h-12 w-12 text-primary" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parsedContacts.length} contacts ready to import
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <p className="font-medium">Click to upload CSV file</p>
                      <p className="text-sm text-muted-foreground">
                        or drag and drop
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Download Sample CSV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Need a template?</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadSampleCSV}
                data-testid="button-download-sample-contacts-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Download a sample CSV file with example contacts. Edit it with your data and upload.
            </p>
          </div>

          {/* Preview */}
          {parsedContacts.length > 0 && importErrors.length === 0 && (
            <div className="space-y-2">
              <Label>Preview (showing first 5)</Label>
              <div className="space-y-2 max-h-48 overflow-auto">
                {parsedContacts.slice(0, 5).map((contact, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name || contact.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      {contact.phone && (
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Errors */}
          {importErrors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-destructive">Import Errors ({importErrors.length})</Label>
              <div className="space-y-2 max-h-48 overflow-auto">
                {importErrors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">Row {error.row}: {error.email}</p>
                      <p className="text-xs text-muted-foreground">{error.error}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                These contacts were not imported. Please fix the errors and try again.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedContacts.length === 0 || importMutation.isPending}
            data-testid="button-start-import-contacts"
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${parsedContacts.length} Contact${parsedContacts.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
