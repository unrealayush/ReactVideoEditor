
const MediaItem = ({ item, duration }) => {
    switch (item.type) {
      case 'video':
        return (
          <video 
            src={item.details.src} 
            style={{
              width: `${item.details.width}px`,
              height: `${item.details.height}px`,
              transform: item.details.transform,
              top: item.details.top,
              left: item.details.left,
              position: 'absolute',
              opacity: item.details.opacity / 100
            }}
          />
        );
      case 'image':
        return (
          <img 
            src={item.details.src} 
            style={{
              width: `${item.details.width}px`,
              height: `${item.details.height}px`,
              transform: item.details.transform,
              top: item.details.top,
              left: item.details.left,
              position: 'absolute',
              opacity: item.details.opacity / 100
            }}
          />
        );
      case 'audio':
        return (
          <audio 
            src={item.details.src} 
            style={{ display: 'none' }}
          />
        );
      default:
        return null;
    }
  };