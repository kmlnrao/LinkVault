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
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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

  const { data: groups = [] } = useQuery<any[]>({
    queryKey: ["/api/groups"],
    enabled: isOpen && shareAfterImport && shareTargetType === "group",
  });

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
      const response = await apiRequest("/api/links/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: parsedLinks,
          shareToGroup: shareAfterImport && shareTargetType === "group" ? selectedGroupId : undefined,
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Import successful",
        description: `${parsedLinks.length} links imported successfully`,
      });
      handleClose();
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

          {/* CSV Format Example */}
          <div className="space-y-2">
            <Label>CSV Format Example</Label>
            <div className="bg-muted p-3 rounded text-xs font-mono">
              <div>title,url,category,institution,bonusValue,notes</div>
              <div>Chase Sapphire,https://chase.com/refer/123,Credit Cards,Chase,$200,Great card</div>
              <div>Amex Platinum,https://amex.com/refer/456,Credit Cards,American Express,75000 points,</div>
            </div>
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
          {parsedLinks.length > 0 && (
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
