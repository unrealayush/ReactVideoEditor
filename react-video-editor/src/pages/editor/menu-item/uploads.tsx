import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Draggable from "@/components/shared/draggable";
import { IImage,IVideo,IAudio } from "@designcombo/types";
import { generateId } from "@designcombo/timeline";
import { AUDIOS } from "@/data/audio";
import React from "react";
// import { UploadMedia } from "@/data/uploads";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { Music } from "lucide-react";
import { ADD_IMAGE,ADD_VIDEO,ADD_AUDIO, dispatch } from "@designcombo/events";

import { ScrollArea } from "@/components/ui/scroll-area";
type MediaItem = IImage | IVideo | IAudio;
const UploadMedia: MediaItem[] = []; // Explicitly define the type

export const Uploads =() => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const isDraggingOverTimeline = useIsDraggingOverTimeline();
  const [isUploading,setUploading]=useState(false)
  useEffect(()=>{

  },[isUploading])

  const handleAddImage = (payload: Partial<IImage>) => {
    dispatch(ADD_IMAGE, {
      payload,
      options: {},
    });
  };
  const handleAddVideo = (payload: Partial<IVideo>) => {
    dispatch(ADD_VIDEO, {
      payload,
      options: {
        trackId: "main",
      },
    });
  };
  const handleAddAudio = (payload: Partial<IAudio>) => {
    dispatch(ADD_AUDIO, {
      payload,
      options: {
        resourceId: "main",
      },
    });
  };

 

  const onInputFileChange = async () => {
    setUploading(true)
    const files = inputFileRef.current?.files;
    if (files && files.length > 0) {
      const uploadedFiles = Array.from(files);
      
      const formData = new FormData();
      formData.append('files', uploadedFiles[0]); // Append first file
  
      try {
        const response = await fetch('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        });
  
        if (!response.ok) {
          throw new Error('Upload failed');
        }
  
        const result = await response.json();
        if (result.type === "audio"){
          AUDIOS.push(result)
          setUploading(false)

          return

        }
        UploadMedia.push(result);
        // Handle successful upload 
        console.log('Upload successful:', result);
        
        // You might want to update state or trigger a refresh of media list here
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    setUploading(false)
  };
  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Your media
      </div>
      <input
        onChange={onInputFileChange}
        ref={inputFileRef}
        type="file"
        className="hidden"
        accept="image/*,audio/*,video/*"
      />
      <div className="px-4 py-2">
        <div>
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects">Project</TabsTrigger>
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
            </TabsList>
            <TabsContent value="projects">
              <Button
                onClick={() => {
                  inputFileRef.current?.click();
                }}
                className="flex w-full gap-2"
                variant="secondary"
              >
                <UploadIcon size={16} /> {isUploading ? "Uploading..." : "Upload"}
              </Button>
              <div></div>
            </TabsContent>
            <TabsContent value="workspace">
              <Button
                onClick={() => {
                  inputFileRef.current?.click();
                }}
                className="flex w-full gap-2"
                variant="secondary"
              >
                <UploadIcon size={16} /> {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="masonry-sm px-4">
          {UploadMedia.map((image, index) => {
            if (image.type === "video") {
              return (
                <VideoItem
                  key={index}
                  video={image}
                  shouldDisplayPreview={!isDraggingOverTimeline}
                  handleAddImage={handleAddVideo}
                />
              );
            }else if (image.type === "audio") {
              return (
                <AudioItem
                  key={index}
                  audio={image}
                  shouldDisplayPreview={!isDraggingOverTimeline}
                  handleAddAudio={handleAddAudio}
                />
              );
            }else {
              return (
                <ImageItem
                  key={index}
                  image={image}
                  shouldDisplayPreview={!isDraggingOverTimeline}
                  handleAddImage={handleAddImage}
                />
              );
            }
            
          })}
        </div>
      <ScrollArea>
        <div className="masonry-sm px-4"></div>
      </ScrollArea>
    </div>
  );
};

const VideoItem = ({
  handleAddImage,
  video,
  shouldDisplayPreview,
}: {
  handleAddImage: (payload: Partial<IVideo>) => void;
  video: Partial<IVideo>;
  shouldDisplayPreview: boolean;
}) => {
  const style = React.useMemo(
    () => ({
      backgroundImage: `url(${video.preview})`,
      backgroundSize: "cover",
      width: "80px",
      height: "80px",
    }),
    [video.preview],
  );

  return (
    <Draggable
      data={video}
      renderCustomPreview={<div style={style} className="draggable" />}
      shouldDisplayPreview={shouldDisplayPreview}
    >
      <div
        onClick={() =>
          handleAddImage({
            id: generateId(),
            details: {
              src: video.details!.src,
            },
          } as IVideo)
        }
        className="flex w-full items-center justify-center overflow-hidden bg-background pb-2"
      >
        <img
          draggable={false}
          src={video.preview}
          className="h-full w-full rounded-md object-cover"
          alt="image"
        />
      </div>
    </Draggable>
  );
};
const ImageItem = ({
  handleAddImage,
  image,
  shouldDisplayPreview,
}: {
  handleAddImage: (payload: Partial<IImage>) => void;
  image: Partial<IImage>;
  shouldDisplayPreview: boolean;
}) => {
  const style = React.useMemo(
    () => ({
      backgroundImage: `url(${image.preview})`,
      backgroundSize: "cover",
      width: "80px",
      height: "80px",
    }),
    [image.preview],
  );

  return (
    <Draggable
      data={image}
      renderCustomPreview={<div style={style} />}
      shouldDisplayPreview={shouldDisplayPreview}
    >
      <div
        onClick={() =>
          handleAddImage({
            id: generateId(),
            details: {
              src: image.details!.src,
            },
          } as IImage)
        }
        className="flex w-full items-center justify-center overflow-hidden bg-background pb-2"
      >
        <img
          draggable={false}
          src={image.preview}
          className="h-full w-full rounded-md object-cover"
          alt="image"
        />
      </div>
    </Draggable>
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