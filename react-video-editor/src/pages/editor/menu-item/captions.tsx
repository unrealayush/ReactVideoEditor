import { Button } from "@/components/ui/button";
// import { uploadedFileList } from "./uploads";
import { useEffect, useState } from "react";
import { ItemType } from "@designcombo/types";
import { getCaptionLines, getCaptions } from "../utils/captions";
import { ADD_CAPTION, dispatch } from "@designcombo/events";
import { loadFonts } from "../utils/fonts";
import useStore from "../store/use-store";
import { ITrackItem } from "@designcombo/types";



export const Captions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { activeIds, trackItemsMap } = useStore();
  const [selectedVideo, setselectedVideo] = useState<ITrackItem | null>(null);

  const [controlType, setControlType] = useState<ItemType | null>(null);
  // console.log(uploadedFileList)
  console.log(controlType)
  useEffect(() => {
    if (activeIds.length === 1) {
      const [id] = activeIds;
      const trackItem = trackItemsMap[id];
      setselectedVideo(trackItem)
      if (trackItem) {
        setControlType(trackItem.type);
      }
    } else {
      setControlType(null);
    }
    console.log(activeIds);
  }, [activeIds, trackItemsMap]);

  // console.log(activeIds, trackItemsMap);
  const generateCaptions = async () => {
    setIsLoading(true);
    setError(null);
    
    
    try {
      if (!selectedVideo) {
        throw new Error("No video selected");
      }
      const videoUrl = selectedVideo.details.src;
      console.log(selectedVideo);
      
      const response = await fetch("http://127.0.0.1:5000/api/transcribe/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
          language: "en"
        })
      });
      console.log(response);
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);
      

      // Load required fonts
      await loadFonts([
        {
          name: "Bangers",
          url: "https://fonts.gstatic.com/s/bangers/v13/FeVQS0BTqb0h60ACL5la2bxii28.ttf",
        },
      ]);

      // Process captions
      const captionLines = getCaptionLines(data, 64, "theboldfont", 800,selectedVideo.display.from);
      
      const captions = getCaptions(captionLines);

      // Dispatch captions
      dispatch(ADD_CAPTION, {
        payload: captions,
        options:{}
      });

    } catch (err:any) {
      setError(err.message);
      console.error("Transcription error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Captions
      </div>
      <div className="flex flex-col gap-8 px-4 py-4">
        <div className="text-center text-sm text-muted-foreground">
          Recognize speech in the selected video/audio and generate captions
          automatically.
        </div>
        {error && (
          <div className="text-center text-sm text-red-500">
            {error}
          </div>
        )}
        <Button 
          onClick={generateCaptions} 
          variant="default" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate"}
        </Button>
      </div>
    </div>
  );
};