import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  FormField
} from './DialogComponents';

// Define types for form data with explicit options
interface FormData {
  prompt: string;
  style: 'realistic' | 'artistic' | 'cartoon' | 'abstract';
  size: '1024x1024' | '512x512' | '256x256';
  quality: 'standard' | 'high' | 'premium';
}

// Define prop types for the component
interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (formData: FormData) => Promise<void>;
}

const INITIAL_FORM_STATE: FormData = {
  prompt: "",
  style: "realistic",
  size: "1024x1024",
  quality: "standard"
};

export const ImageGenerationDialog: React.FC<ImageGenerationDialogProps> = ({ 
  open, 
  onOpenChange, 
  onGenerate 
}) => {
  const [isGenerating, setGenerating] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setGenerating(true);
      await onGenerate(formData);
      setFormData(INITIAL_FORM_STATE);
    } catch (error) {
      console.error('Error generating:', error);
    } finally {
      setGenerating(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Image</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <FormField label="Prompt">
            <input
              type="text"
              name="prompt"
              placeholder="Describe the image you want to generate..."
              value={formData.prompt}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FormField>
          
          <FormField label="Style">
            <select
              name="style"
              value={formData.style}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="realistic">Realistic</option>
              <option value="artistic">Artistic</option>
              <option value="cartoon">Cartoon</option>
              <option value="abstract">Abstract</option>
            </select>
          </FormField>

          <FormField label="Size">
            <select
              name="size"
              value={formData.size}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="1024x1024">1024x1024</option>
              <option value="512x512">512x512</option>
              <option value="256x256">256x256</option>
            </select>
          </FormField>

          <FormField label="Quality">
            <select
              name="quality"
              value={formData.quality}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="premium">Premium</option>
            </select>
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.prompt || isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};