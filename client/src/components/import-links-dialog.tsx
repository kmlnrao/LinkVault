import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ImportLinksDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedLink {
  title: string;
  url: string;
  category: string;
  institution?: string;
  bonusValue?: string;
  notes?: string;
}

export function ImportLinksDialog({ isOpen, onClose }: ImportLinksDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([]);
  const [shareAfterImport, setShareAfterImport] = useState(false);
  const [shareTargetType, setShareTargetType] = useState<"group" | "contact">("group");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [importErrors, setImportErrors] = useState<Array<{row: number, title: string, error: string}>>([]);

  const { data: groups = [] } = useQuery<any[]>({
    queryKey: ["/api/groups"],
    enabled: isOpen && shareAfterImport && shareTargetType === "group",
  });

  const downloadSampleCSV = () => {
    // Generate sample CSV with example data
    const csvContent = `Title,URL,Category,Institution,Bonus Value,Expiration Date,Notes
Chase Sapphire Preferred,https://www.referyourchasecard.com/6a/EXAMPLE123,Credit Cards,Chase,60000 points,2024-12-31,Earn 60k bonus points after $4k spend in 3 months
Capital One Venture X,https://capital.one/refer/EXAMPLE456,Credit Cards,Capital One,$200 statement credit,2024-06-30,100k miles + $200 travel credit
Ally Bank Savings,https://refer.ally.com/SAMPLE789,Bank Accounts,Ally Bank,$100 bonus,,Open account with $500 minimum deposit
American Express Gold,https://americanexpress.com/refer/DEMO999,Credit Cards,American Express,90000 points,2024-09-15,Great for dining and groceries`;

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "linkvault_sample_import.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Sample CSV downloaded",
      description: "Edit this file and upload it to import your links",
    });
  };

  const parseCSV = (text: string): ParsedLink[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const requiredHeaders = ["title", "url", "category"];
    const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));

    if (!hasRequiredHeaders) {
      throw new Error("CSV must have columns: title, url, category");
    }

    const links: ParsedLink[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const link: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          link[header] = values[index];
        }
      });

      if (link.title && link.url && link.category) {
        links.push({
          title: link.title,
          url: link.url,
          category: link.category,
          institution: link.institution,
          bonusValue: link.bonusvalue || link.bonus,
          notes: link.notes,
        });
      }
    }

    return links;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Clear previous errors when selecting a new file
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
        const links = parseCSV(text);
        setParsedLinks(links);
        toast({
          title: "File parsed successfully",
          description: `Found ${links.length} valid links`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Parse error",
          description: error.message,
        });
        setFile(null);
        setParsedLinks([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/links/bulk-import", {
        links: parsedLinks,
        shareToGroup: shareAfterImport && shareTargetType === "group" ? selectedGroupId : undefined,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      
      // Show detailed success/error message
      const hasErrors = data.errors && data.errors.length > 0;
      
      toast({
        variant: hasErrors ? "default" : "default",
        title: hasErrors ? "Import completed with errors" : "Import successful",
        description: data.message || `${data.count} of ${data.total} links imported successfully`,
      });
      
      // Store errors to show in UI
      if (hasErrors) {
        setImportErrors(data.errors);
        // Keep dialog open so user can review errors
      } else {
        // Only close dialog if no errors
        handleClose();
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Failed to import links",
      });
    },
  });

  const handleImport = () => {
    if (parsedLinks.length === 0) {
      toast({
        variant: "destructive",
        title: "No links to import",
        description: "Please upload a valid CSV file first",
      });
      return;
    }

    if (shareAfterImport && shareTargetType === "group" && !selectedGroupId) {
      toast({
        variant: "destructive",
        title: "No group selected",
        description: "Please select a group to share with",
      });
      return;
    }

    importMutation.mutate();
  };

  const handleClose = () => {
    setFile(null);
    setParsedLinks([]);
    setShareAfterImport(false);
    setSelectedGroupId("");
    setImportErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-import-links">
        <DialogHeader>
          <DialogTitle>Import Links from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your referral links. Required columns: title, url, category
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
                id="csv-upload"
                data-testid="input-csv-file"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  {file ? (
                    <>
                      <FileSpreadsheet className="h-12 w-12 text-primary" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parsedLinks.length} links ready to import
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
                data-testid="button-download-sample-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Download a sample CSV file with example data. Edit it with your links and upload.
            </p>
          </div>

          {/* Share Options */}
          {parsedLinks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="share-after-import"
                  checked={shareAfterImport}
                  onCheckedChange={(checked) => setShareAfterImport(checked as boolean)}
                  data-testid="checkbox-share-after-import"
                />
                <Label htmlFor="share-after-import" className="cursor-pointer">
                  Share all imported links with a group
                </Label>
              </div>

              {shareAfterImport && (
                <div className="ml-6 space-y-2">
                  <Label>Select Group</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger data-testid="select-share-group">
                      <SelectValue placeholder="Choose a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {parsedLinks.length > 0 && importErrors.length === 0 && (
            <div className="space-y-2">
              <Label>Preview (showing first 5)</Label>
              <div className="space-y-2 max-h-48 overflow-auto">
                {parsedLinks.slice(0, 5).map((link, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
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
                      <p className="font-medium truncate">Row {error.row}: {error.title}</p>
                      <p className="text-xs text-muted-foreground">{error.error}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                These links were not imported. Please fix the errors and try again.
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
            disabled={parsedLinks.length === 0 || importMutation.isPending}
            data-testid="button-import"
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import {parsedLinks.length} Links
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
