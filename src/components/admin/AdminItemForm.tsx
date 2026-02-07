import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { Upload, X, Play, AlertCircle, Code, FileUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const urlSchema = z.string().url("Must be a valid URL").max(500);
const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  category_ids: z.array(z.string().uuid()).min(1, "At least one category is required"),
  file_type: z.string().trim().min(1, "File type is required").max(50),
  file_size: z.string().trim().max(50).optional(),
  version: z.string().trim().max(50).optional(),
  download_url: urlSchema,
  thumbnail_url: z.string().trim().optional(),
  download_count: z.number().int().min(0).optional(),
  average_rating: z.number().min(0).max(5).optional(),
  rating_count: z.number().int().min(0).optional(),
});

interface Category {
  id: string;
  name: string;
}

interface AdminItemFormProps {
  item?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminItemForm = ({ item, onSuccess, onCancel }: AdminItemFormProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    item?.thumbnail_url ? JSON.parse(item.thumbnail_url).filter((url: string) => url) : []
  );
  const [testOutput, setTestOutput] = useState<string[]>([]);
  const [testError, setTestError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: item?.title || "",
    description: item?.description || "",
    thumbnail_url: item?.thumbnail_url || "",
    download_url: item?.download_url || "",
    file_type: item?.file_type || "",
    file_size: item?.file_size || "",
    version: item?.version || "",
    featured: item?.featured || false,
    download_count: item?.download_count || 0,
    average_rating: item?.average_rating || 0,
    rating_count: item?.rating_count || 0,
    custom_js: item?.custom_js || "",
  });

  useEffect(() => {
    fetchCategories();
    if (item) {
      fetchItemCategories();
    }
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    if (data) setCategories(data);
  };

  const fetchItemCategories = async () => {
    if (!item?.id) return;
    const { data } = await supabase
      .from("download_item_categories")
      .select("category_id")
      .eq("item_id", item.id);
    if (data) {
      setSelectedCategories(data.map(ic => ic.category_id));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} size must be less than 5MB`);
        continue;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setImageFiles(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const uploadImages = async (): Promise<string> => {
    if (imageFiles.length === 0) return formData.thumbnail_url;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("thumbnails")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      // Combine with existing URLs from formData
      const existingUrls = formData.thumbnail_url 
        ? JSON.parse(formData.thumbnail_url).filter((url: string) => url)
        : [];
      const allUrls = [...existingUrls, ...uploadedUrls];
      
      return JSON.stringify(allUrls);
    } catch (error) {
      toast.error("Failed to upload images");
      return formData.thumbnail_url;
    } finally {
      setUploading(false);
    }
  };

  const jsTemplates = {
    adMonetization: `// Ad Monetization - Requires 3 clicks before download
// Replace the URL below with your actual ad network URL

let clickCount = parseInt(sessionStorage.getItem('download_clicks_' + item.id) || '0');

if (clickCount < 3) {
  // Open ad URL in new tab
  window.open('https://www.effectivegatecpm.com/cuuerxmk8?key=778d89c91abfbc774376c60a4bb4ac59', '_blank');
  
  // Increment click count
  clickCount++;
  sessionStorage.setItem('download_clicks_' + item.id, clickCount.toString());
  
  if (clickCount < 3) {
    // Show user feedback for clicks 1-2
    alert('Ads lets us keep things free — close any ad tab and click Download again up to ' + (3 - clickCount) + ' time(s) to proceed the download');
    
    // Prevent actual download
    return false;
  } else {
    // This is the 3rd click - ad opened, now allow download
    sessionStorage.removeItem('download_clicks_' + item.id);
    return true;
  }
} else {
  // Fallback: reset and allow download
  sessionStorage.removeItem('download_clicks_' + item.id);
  return true;
}`,
    simpleTracking: `// Simple Analytics Tracking
console.log('Download started for:', item.title);
console.log('File type:', item.file_type);
console.log('Timestamp:', new Date().toISOString());

// You can send this to your analytics service
// Example: fetch('/api/track', { method: 'POST', body: JSON.stringify({ item_id: item.id }) });`,
    
    delayedDownload: `// Delayed Download (3 seconds)
alert('Your download will start in 3 seconds...');

setTimeout(() => {
  window.location.href = item.download_url;
}, 3000);

// Prevent immediate download
return false;`,

    confirmDownload: `// Confirmation Dialog
if (!confirm('Do you want to download ' + item.title + '?')) {
  return false;
}
return true;`
  };

  const handleTemplateSelect = (template: string) => {
    if (template && jsTemplates[template as keyof typeof jsTemplates]) {
      setFormData({
        ...formData,
        custom_js: jsTemplates[template as keyof typeof jsTemplates]
      });
      toast.success("Template loaded! You can now customize it.");
    }
  };

  const handleTestJS = () => {
    setTestOutput([]);
    setTestError(null);

    if (!formData.custom_js || formData.custom_js.trim() === "") {
      setTestError("No JavaScript code to test");
      return;
    }

    // Create mock item object for testing
    const mockItem = {
      id: item?.id || "test-item-id",
      title: formData.title || "Test Item",
      download_url: formData.download_url || "https://example.com/download",
      file_type: formData.file_type || "test",
    };

    // Capture console output
    const consoleLog: string[] = [];
    const mockConsole = {
      log: (...args: any[]) => consoleLog.push(args.map(a => String(a)).join(" ")),
      error: (...args: any[]) => consoleLog.push("ERROR: " + args.map(a => String(a)).join(" ")),
      warn: (...args: any[]) => consoleLog.push("WARN: " + args.map(a => String(a)).join(" ")),
    };

    try {
      // Create a safe function with mock console
      const testFunction = new Function(
        'item', 
        'window', 
        'document', 
        'console',
        formData.custom_js
      );
      
      // Execute with mock objects
      testFunction(mockItem, {}, {}, mockConsole);
      
      setTestOutput(consoleLog.length > 0 ? consoleLog : ["✓ Code executed successfully (no console output)"]);
    } catch (error: any) {
      setTestError(error.message || "Unknown error occurred");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images if selected
      const thumbnailUrl = await uploadImages();
      
      const dataToSave = {
        ...formData,
        thumbnail_url: thumbnailUrl || formData.thumbnail_url || JSON.stringify([]),
        category_ids: selectedCategories,
      };

      // Validate form data
      const validation = itemSchema.safeParse(dataToSave);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (item) {
        // Update existing item
        const { category_ids, ...itemData } = dataToSave;
        const { error } = await supabase
          .from("download_items")
          .update(itemData)
          .eq("id", item.id);

        if (error) throw error;

        // Update categories
        await supabase
          .from("download_item_categories")
          .delete()
          .eq("item_id", item.id);

        const categoryInserts = selectedCategories.map(cat_id => ({
          item_id: item.id,
          category_id: cat_id,
        }));

        await supabase
          .from("download_item_categories")
          .insert(categoryInserts);

        toast.success("Item updated successfully");
      } else {
        // Create new item
        const { category_ids, ...itemData } = dataToSave;
        const { data: newItem, error } = await supabase
          .from("download_items")
          .insert([itemData])
          .select()
          .single();

        if (error) throw error;

        // Insert categories
        const categoryInserts = selectedCategories.map(cat_id => ({
          item_id: newItem.id,
          category_id: cat_id,
        }));

        await supabase
          .from("download_item_categories")
          .insert(categoryInserts);

        toast.success("Item created successfully");
      }

      onSuccess();
    } catch (error) {
      toast.error("Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">{item ? "Edit" : "Add New"} Download Item</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Categories * (Select at least one)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`cat-${cat.id}`}
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor={`cat-${cat.id}`} className="font-normal cursor-pointer">
                  {cat.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file_type">File Type *</Label>
          <Input
            id="file_type"
            value={formData.file_type}
            onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
            placeholder="e.g., apk, exe, pdf"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Thumbnail Images (Multiple supported: jpg, png, jpeg, ico, svg, webp)</Label>
          <div className="space-y-3">
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative w-full aspect-square border rounded-lg overflow-hidden">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreviews(prev => prev.filter((_, i) => i !== index));
                        setImageFiles(prev => prev.filter((_, i) => i !== index));
                        
                        // Update formData if this was from existing URLs
                        try {
                          const urls = JSON.parse(formData.thumbnail_url || '[]');
                          const filteredUrls = urls.filter((_: string, i: number) => i !== index);
                          setFormData({ ...formData, thumbnail_url: JSON.stringify(filteredUrls) });
                        } catch (e) {
                          // Ignore parse errors
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Upload Images (Multiple)</span>
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/jpg,image/jpeg,image/png,image/ico,image/svg+xml,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  multiple
                />
              </div>
              
              <div className="flex-1">
                <Label htmlFor="thumbnail_url" className="text-sm text-muted-foreground">Or paste URLs (one per line)</Label>
                <Textarea
                  id="thumbnail_url"
                  value={(() => {
                    try {
                      const urls = JSON.parse(formData.thumbnail_url || '[]');
                      return Array.isArray(urls) ? urls.join('\n') : formData.thumbnail_url;
                    } catch {
                      return formData.thumbnail_url;
                    }
                  })()}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const urls = inputValue.split('\n').map(url => url.trim()).filter(url => url);
                    const jsonUrls = JSON.stringify(urls);
                    setFormData({ ...formData, thumbnail_url: jsonUrls });
                    setImagePreviews(urls);
                  }}
                  placeholder="https://example.com/image1.jpg&#x0a;https://example.com/image2.jpg"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="download_url">Download File *</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Upload a file from your computer or paste a URL (Google Drive, etc.)
          </p>
          
          <div className="flex flex-col gap-3">
            {/* File upload option */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Upload from Computer</span>
              </div>
              
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setFormData({ ...formData, download_url: item?.download_url || "" });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to select file (APK, EXE, ZIP, PDF, etc.)
                      </span>
                    </div>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="*/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      if (file.size > 500 * 1024 * 1024) {
                        toast.error("File size must be less than 500MB");
                        return;
                      }
                      
                      setSelectedFile(file);
                      
                      // Auto-detect file type
                      const ext = file.name.split('.').pop()?.toLowerCase() || '';
                      if (!formData.file_type) {
                        setFormData(prev => ({ ...prev, file_type: ext }));
                      }
                      
                      // Set file size
                      const sizeMB = file.size / (1024 * 1024);
                      const sizeStr = sizeMB >= 1 
                        ? `${sizeMB.toFixed(2)} MB` 
                        : `${(file.size / 1024).toFixed(2)} KB`;
                      setFormData(prev => ({ ...prev, file_size: sizeStr }));
                      
                      // Upload immediately
                      setUploadingFile(true);
                      setUploadProgress(10);
                      
                      try {
                        const fileExt = file.name.split(".").pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                        
                        setUploadProgress(30);
                        
                        const { error: uploadError } = await supabase.storage
                          .from("downloads")
                          .upload(fileName, file);
                        
                        if (uploadError) throw uploadError;
                        
                        setUploadProgress(80);
                        
                        const { data: { publicUrl } } = supabase.storage
                          .from("downloads")
                          .getPublicUrl(fileName);
                        
                        setFormData(prev => ({ ...prev, download_url: publicUrl }));
                        setUploadProgress(100);
                        toast.success("File uploaded successfully!");
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast.error("Failed to upload file");
                        setSelectedFile(null);
                      } finally {
                        setUploadingFile(false);
                        setUploadProgress(0);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              )}
              
              {uploadingFile && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
            
            {/* URL option */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t" />
              <span className="text-sm text-muted-foreground">OR</span>
              <div className="flex-1 border-t" />
            </div>
            
            <Input
              id="download_url"
              type="url"
              value={formData.download_url}
              onChange={(e) => {
                setFormData({ ...formData, download_url: e.target.value });
                if (e.target.value) setSelectedFile(null);
              }}
              placeholder="https://drive.google.com/... or any direct download URL"
              required={!selectedFile}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="file_size">File Size</Label>
            <Input
              id="file_size"
              value={formData.file_size}
              onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
              placeholder="e.g., 25 MB"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="e.g., 1.0.0"
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured" className="text-base font-semibold">Featured Item</Label>
              <p className="text-sm text-muted-foreground">Display this item in the featured section on homepage</p>
            </div>
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            />
          </div>
        </div>

        <div className="space-y-2 border-t pt-6">
          <Label className="text-base font-semibold">Initial Stats (Optional)</Label>
          <p className="text-sm text-muted-foreground mb-4">Set starting download count and ratings for this item</p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="download_count">Download Count</Label>
              <Input
                id="download_count"
                type="number"
                min="0"
                value={formData.download_count}
                onChange={(e) => setFormData({ ...formData, download_count: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="average_rating">Average Rating (0-5)</Label>
              <Input
                id="average_rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.average_rating}
                onChange={(e) => setFormData({ ...formData, average_rating: parseFloat(e.target.value) || 0 })}
                placeholder="0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating_count">Rating Count</Label>
              <Input
                id="rating_count"
                type="number"
                min="0"
                value={formData.rating_count}
                onChange={(e) => setFormData({ ...formData, rating_count: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t pt-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <Label htmlFor="custom_js" className="text-base font-semibold">
                Custom JavaScript (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                JavaScript code to execute when download button is clicked. Use for analytics tracking, custom behavior, etc.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger className="w-[220px] h-9">
                  <SelectValue placeholder="Load template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adMonetization">💰 Ad Monetization (3 clicks)</SelectItem>
                  <SelectItem value="simpleTracking">📊 Simple Tracking</SelectItem>
                  <SelectItem value="delayedDownload">⏱️ Delayed Download</SelectItem>
                  <SelectItem value="confirmDownload">✅ Confirm Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            id="custom_js"
            value={formData.custom_js}
            onChange={(e) => setFormData({ ...formData, custom_js: e.target.value })}
            placeholder="// Select a template above or write your own JavaScript code here..."
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Available variables: <code className="px-1 py-0.5 bg-muted rounded text-xs">item</code>, <code className="px-1 py-0.5 bg-muted rounded text-xs">window</code>, <code className="px-1 py-0.5 bg-muted rounded text-xs">document</code>, <code className="px-1 py-0.5 bg-muted rounded text-xs">console</code>
          </p>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Test Console</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestJS}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Test Code
              </Button>
            </div>

            {testError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-mono text-xs">
                  {testError}
                </AlertDescription>
              </Alert>
            )}

            {testOutput.length > 0 && (
              <div className="bg-muted rounded-md p-3 space-y-1 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Console Output:</p>
                {testOutput.map((line, idx) => (
                  <div key={idx} className="text-xs font-mono text-foreground">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading || uploading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {uploading ? "Uploading..." : loading ? "Saving..." : item ? "Update Item" : "Create Item"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
