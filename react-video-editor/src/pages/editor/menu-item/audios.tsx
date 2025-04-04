import Draggable from "@/components/shared/draggable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AUDIOS } from "@/data/audio";
import { ADD_AUDIO, dispatch } from "@designcombo/events";
import { IAudio } from "@designcombo/types";
import { Music } from "lucide-react";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import React from "react";
import { AudioGenerationDialog } from "./AudioDialogBox";

// Define the type for generation data to match the AudioGenerationDialog
interface GenerationData {
  prompt: string;
  type: 'tts' | 'music';
}

export const Audios = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isDraggingOverTimeline = useIsDraggingOverTimeline();

  const handleAddAudio = (payload: Partial<IAudio>) => {
    dispatch(ADD_AUDIO, {
      payload,
      options: {},
    });
  };

  const handleGenerateImage = async (generationData: GenerationData) => {
    try {
      const response = await fetch("http://localhost:3000/api/generate/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: generationData.prompt,
          modelType: generationData.type,
          count: 1,
        })
      });
     
      const result = await response.json();
      AUDIOS.push(result[0]);
      console.log(result);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Audios
      </div>
      <ScrollArea>
        <div className="flex flex-col px-2">
          {AUDIOS.map((audio, index) => (
            <AudioItem
              shouldDisplayPreview={!isDraggingOverTimeline}
              handleAddAudio={handleAddAudio}
              audio={audio}
              key={index}
            />
          ))}
        </div>
      </ScrollArea>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="default"
        className="w-full"
      >
        Generate Audio
      </Button>
      <AudioGenerationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onGenerate={handleGenerateImage}
      />
    </div>
  );
};

const AudioItem = ({
  handleAddAudio,
  audio,
  shouldDisplayPreview,
}: {
  handleAddAudio: (payload: Partial<IAudio>) => void;
  audio: Partial<IAudio>;
  shouldDisplayPreview: boolean;
}) => {
  const style = React.useMemo(
    () => ({
      backgroundImage: `url(https://cdn.designcombo.dev/thumbnails/music-preview.png)`,
      backgroundSize: "cover",
      width: "70px",
      height: "70px",
    }),
    [],
  );

  return (
    <Draggable
      data={audio}
      renderCustomPreview={<div style={style} />}
      shouldDisplayPreview={shouldDisplayPreview}
    >
      <div
        draggable={false}
        onClick={() => handleAddAudio(audio)}
        style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr",
        }}
        className="flex cursor-pointer gap-4 px-2 py-1 text-sm hover:bg-zinc-800/70"
      >
        <div className="flex h-12 items-center justify-center bg-zinc-800">
          <Music width={16} />
        </div>
        <div className="flex flex-col justify-center">
          <div>{audio.name}</div>
          <div className="text-zinc-400">{audio.metadata?.author}</div>
        </div>
      </div>
    </Draggable>
  );
};