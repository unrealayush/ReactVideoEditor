// components/ImageGallery/Images.tsx
import  { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/data/images";
import { ADD_IMAGE, dispatch } from "@designcombo/events";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { ImageGenerationDialog } from './ImageGenerationDialog';
import { ImageItem } from './ImageItem';
import { IImage } from '@designcombo/types';

export const Images = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isDraggingOverTimeline = useIsDraggingOverTimeline();

  const handleAddImage = (payload:IImage) => {
    dispatch(ADD_IMAGE, {
      payload,
      options: {
        trackId: "main",
      },
    });
  };

  const handleGenerateImage = async (generationData:any) => {
    try {
      const response = await fetch("http://localhost:3000/api/generate/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: generationData.prompt,
          modelType: 'image_gen',
          count: 1,
        })
      });
      
      const result = await response.json();
      IMAGES.push(result[0]);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Photos
      </div>
      <ScrollArea>
        <div className="masonry-sm px-4">
          {IMAGES.map((image, index) => (
            <ImageItem
              key={index}
              image={image}
              shouldDisplayPreview={!isDraggingOverTimeline}
              handleAddImage={handleAddImage}
            />
          ))}
        </div>
      </ScrollArea>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="default"
        className="w-full"
      >
        Generate Image
      </Button>
      
      <ImageGenerationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onGenerate={handleGenerateImage}
      />
    </div>
  );
};

export default Images;