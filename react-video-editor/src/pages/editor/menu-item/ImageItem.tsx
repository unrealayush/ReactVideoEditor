import React, { useMemo } from 'react';
import Draggable from "@/components/shared/draggable";
import { generateId } from "@designcombo/timeline";
import { IImage, IDisplay, IImageDetails } from "@designcombo/types";

// Define prop types for the component
interface ImageItemProps {
  handleAddImage: (payload: IImage) => void;
  image: Partial<IImage>;
  shouldDisplayPreview: boolean;
}

export const ImageItem: React.FC<ImageItemProps> = ({
  handleAddImage,
  image,
  shouldDisplayPreview
}) => {
  const style = useMemo(
    () => ({
      backgroundImage: `url(${image.preview})`,
      backgroundSize: "cover",
      width: "80px",
      height: "80px",
    }),
    [image.preview]
  );

  const handleClick = () => {
    // Ensure all required properties are provided
    if (!image.details?.src) {
      console.warn('Cannot add image without a source');
      return;
    }

    const fullImageData: IImage = {
      id: generateId(),
      type: 'image',
      name: image.name || 'Untitled Image',
      details: {
        src: image.details.src, // Non-null assertion after the earlier check
      } as IImageDetails,
      display: {
        from: 0, // Default start time
        to: 1, // Default end time
        ...image.display
      } as IDisplay,
      metadata: image.metadata || {}, 
      preview: image.preview || '' // Provide a default empty string if preview is undefined
    };

    handleAddImage(fullImageData);
  };

  return (
    <Draggable
      data={image}
      renderCustomPreview={<div style={style} />}
      shouldDisplayPreview={shouldDisplayPreview}
    >
      <div
        onClick={handleClick}
        className="flex w-full items-center justify-center overflow-hidden bg-background pb-2"
      >
        <img
          draggable={false}
          src={image.preview}
          className="h-full w-full rounded-md object-cover"
          alt="image preview"
        />
      </div>
    </Draggable>
  );
};