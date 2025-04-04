import React from 'react';
import { Composition, Sequence, registerRoot } from 'remotion';
import { Video, Audio } from 'remotion';

interface VideoData {
  id: string;
  fps: number;
  tracks: Array<{
    id: string;
    items: string[];
  }>;
  size: { 
    width: number; 
    height: number; 
  };
  trackItemsMap: {
    [key: string]: {
      type: string;
      display: { from: number; to: number };
      duration?: number;
      details: any;
    }
  };
}

const VideoComposition: React.FC<{ data: VideoData }> = ({ data }) => {
  if (!data || !data.tracks || !data.trackItemsMap) {
    console.error('Invalid data structure', data);
    return null;
  }

  // Calculate total video duration dynamically
  const calculateTotalDuration = () => {
    const durations = Object.values(data.trackItemsMap).map(item => 
      item.display.to - item.display.from
    );
    return Math.max(...durations);
  };

  const totalDurationMs = calculateTotalDuration();
  const totalDurationFrames = Math.ceil(totalDurationMs / (1000 / data.fps));

  return (
    <div style={{
      width: data.size.width,
      height: data.size.height,
      position: 'relative'
    }}>
      {data.tracks.reverse().map((track) => (
        track.items.map((itemId) => {
          const item = data.trackItemsMap[itemId];
          if (!item) return null;

          const displayFrom = item.display.from / (1000 / data.fps);
          const displayDuration = (item.display.to - item.display.from) / (1000 / data.fps);
          
          return (
            <Sequence
              key={itemId}
              from={displayFrom}
              durationInFrames={displayDuration}
            >
              <MediaItem 
                item={item} 
                duration={displayDuration}
              />
            </Sequence>
          );
        })
      ))}
    </div>
  );
};

const MediaItem = ({ item, duration }) => {
  const commonStyles = {
    position: 'absolute',
    top: item.details.top,
    left: item.details.left,
    transform: item.details.transform,
    opacity: item.details.opacity / 100,
    borderRadius: `${item.details.borderRadius}px`,
    borderWidth: `${item.details.borderWidth}px`,
    borderColor: item.details.borderColor,
    filter: `blur(${item.details.blur}px) brightness(${item.details.brightness}%)`
  };

  switch (item.type) {
    case 'video':
      return (
        <Video
          src={item.details.src}
          style={{
            ...commonStyles,
            width: `${item.details.width}px`,
            height: `${item.details.height}px`,
          }}
          volume={item.details.volume / 100}
        />
      );
    case 'audio':
      return (
        <Audio
          src={item.details.src}
          volume={item.details.volume / 100}
        />
      );
    case 'image':
      return (
        <img
          src={item.details.src}
          style={{
            ...commonStyles,
            width: `${item.details.width}px`,
            height: `${item.details.height}px`,
          }}
          alt=""
        />
      );
    case 'text':
      return (
        <div
          style={{
            ...commonStyles,
            width: `${item.details.width}px`,
            height: `${item.details.height}px`,
            fontFamily: item.details.fontFamily,
            fontSize: `${item.details.fontSize}px`,
            fontWeight: item.details.fontWeight,
            fontStyle: item.details.fontStyle,
            textDecoration: item.details.textDecoration,
            textAlign: item.details.textAlign,
            color: item.details.color,
            backgroundColor: item.details.backgroundColor,
            textTransform: item.details.textTransform,
            letterSpacing: item.details.letterSpacing,
            lineHeight: item.details.lineHeight,
            wordWrap: item.details.wordWrap,
            wordBreak: item.details.wordBreak,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: `${item.details.textShadow?.x || 2}px ${item.details.textShadow?.y || 2}px ${item.details.textShadow?.blur || 4}px ${item.details.textShadow?.color || 'rgba(0,0,0,0.5)'}`
          }}
        >
          {item.details.text}
        </div>
      );
    case 'caption':
      return (
        <div
          style={{
            ...commonStyles,
            position: 'absolute',
            bottom: item.details.bottom || '10%',
            width: item.details.width || '80%',
            padding: '8px 16px',
            backgroundColor: item.details.backgroundColor || 'rgba(0, 0, 0, 0.75)',
            color: item.details.color || '#ffffff',
            fontFamily: item.details.fontFamily || 'Arial',
            fontSize: item.details.fontSize || '24px',
            textAlign: item.details.textAlign || 'center',
            borderRadius: item.details.borderRadius || '4px',
            margin: '0 auto',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            textShadow: item.details.textShadow || '1px 1px 2px rgba(0, 0, 0, 0.5)',
            whiteSpace: 'pre-wrap',
            lineHeight: item.details.lineHeight || '1.4'
          }}
        >
          {item.details.text}
        </div>
      );
    default:
      return null;
  }
};

const Root: React.FC<{ data?: VideoData }> = ({ data }) => {
  // Use passed data or fallback to sample data
  const finalData = data || {
    id: "sample-video",
    fps: 30,
    tracks: [
      {
        id: "main-video-track",
        items: ["main-video-item"]
      }
    ],
    size: { 
      width: 1080, 
      height: 1920 
    },
    trackItemsMap: {
      "main-video-item": {
        type: "video",
        display: { 
          from: 0, 
          to: 14770 // Dynamic duration from input
        },
        details: {
          src: "https://dwq6jrynran28.cloudfront.net/uploads/d83c23f6-b0a7-45b6-80f7-1f6ca12434cd-output.mp4",
          width: 1080,
          height: 1920,
          volume: 100
        }
      }
    }
  };

  // Calculate total duration dynamically
  const calculateTotalDuration = () => {
    const durations = Object.values(finalData.trackItemsMap).map(item => 
      item.display.to - item.display.from
    );
    return Math.max(...durations);
  };

  const totalDurationMs = calculateTotalDuration();
  const totalDurationFrames = Math.ceil(totalDurationMs / (1000 / finalData.fps));

  return (
    <Composition
      id="VideoComposition"
      component={VideoComposition}
      durationInFrames={totalDurationFrames}
      fps={finalData.fps}
      width={finalData.size.width}
      height={finalData.size.height}
      defaultProps={{ data: finalData }}
    />
  );
};

registerRoot(Root);

export default Root;