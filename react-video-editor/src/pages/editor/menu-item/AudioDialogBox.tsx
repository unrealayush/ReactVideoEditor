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

// Define types for the form data
interface FormData {
  prompt: string;
  type: 'tts' | 'music';
}

// Define prop types for the component
interface AudioGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (formData: FormData) => Promise<void>;
}

// Initial form state with explicit typing
const INITIAL_FORM_STATE: FormData = {
  prompt: "",
  type: "tts"
};

export const AudioGenerationDialog: React.FC<AudioGenerationDialogProps> = ({ 
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
          <DialogTitle>Generate Audio</DialogTitle>
        </DialogHeader>
       
        <div className="grid gap-4 py-4">
          <FormField label="Prompt">
            <input
              type="text"
              name="prompt"
              placeholder="Describe the audio you want to generate..."
              value={formData.prompt}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FormField>
          
          <FormField label="Type">
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="tts">Text To Speech</option>
              <option value="music">Music</option>
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