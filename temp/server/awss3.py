import os
import shutil
import logging
import requests
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from moviepy.editor import *
from moviepy.config import change_settings
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Optional: Configure ImageMagick path if needed
change_settings({"IMAGEMAGICK_BINARY": r"C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe"})

def safe_download_file(url: str, filename: str, max_retries: int = 3) -> Optional[str]:
    """
    Download file with retry mechanism and improved error handling.
    
    Args:
        url (str): Source URL of the file
        filename (str): Local filename to save
        max_retries (int): Maximum number of download attempts
    
    Returns:
        Optional[str]: Path to downloaded file or None if download fails
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return filename
        except Exception as e:
            logger.warning(f"Download attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                logger.error(f"Failed to download {url}")
                return None

def create_text_clip(
    text_item: Dict[str, Any], 
    duration: int, 
    total_width: int, 
    total_height: int,
    temp_dir: str
) -> Optional[VideoClip]:
    """
    Advanced text clip creation with robust word-level timing support.
    
    Args:
        text_item (Dict): Text configuration details
        duration (int): Clip duration in milliseconds
        total_width (int): Total video width
        total_height (int): Total video height
        temp_dir (str): Temporary directory for font files
    
    Returns:
        Optional[VideoClip]: Created text clip with word-level timing
    """
    try:
        # Validate text item configuration
        if not text_item or 'details' not in text_item:
            logger.error("Invalid text item configuration")
            return None
        
        details = text_item['details']
        
        # Validate text content
        if not details or 'text' not in details:
            logger.error("Missing text content in details")
            return None
        
        # Font handling
        font_path = details.get('fontFamily', 'Arial')
        if 'fontUrl' in details:
            try:
                font_filename = os.path.join(temp_dir, f"custom_font_{hash(details['fontUrl'])}.ttf")
                downloaded_font = safe_download_file(details['fontUrl'], font_filename)
                if downloaded_font:
                    font_path = downloaded_font
            except Exception as e:
                logger.warning(f"Font download failed: {e}. Using default font.")
        
        # Positioning
        try:
            left = int(str(details.get('left', '0px')).replace('px', ''))
            top = int(str(details.get('top', '0px')).replace('px', ''))
        except ValueError:
            left, top = 0, 0
        
        # Opacity handling
        opacity = details.get('opacity', 100) / 100
        
        # Word-level timing support
        if details.get('words'):
            # Create clips for each word with precise timing
            word_clips = []
            for word_info in details['words']:
                word = word_info.get('word', '').strip()
                start_time = word_info.get('start', 0) / 1000
                end_time = word_info.get('end', duration/1000) / 1000
                word_duration = max(end_time - start_time, 0.1)
                
                word_clip = TextClip(
                    word, 
                    fontsize=details.get('fontSize', 64),
                    color=details.get('color', 'white'),
                    font=font_path,
                    size=(total_width, details.get('height', 100)),
                    method='caption'
                ).set_start(start_time).set_duration(word_duration)
                
                word_clips.append(word_clip)
            
            # Composite clip with all words
            if word_clips:
                return CompositeVideoClip(
                    word_clips, 
                    size=(total_width, total_height)
                ).set_position((left, top)).set_opacity(opacity)
        
        # Fallback to full text clip if no word-level timing
        text_clip = TextClip(
            details['text'],
            fontsize=details.get('fontSize', 64),
            color=details.get('color', 'white'),
            font=font_path,
            size=(details.get('width', total_width), details.get('height', 100)),
            method='caption'
        )
        
        return (text_clip
                .set_duration(duration / 1000)
                .set_position((left, top))
                .set_opacity(opacity))
    
    except Exception as e:
        logger.error(f"Text clip creation error: {e}")
        return None

def parallel_download(urls_and_paths):
    """
    Download multiple files in parallel.
    
    Args:
        urls_and_paths (List[Tuple]): List of (url, filename) tuples
    
    Returns:
        List[Optional[str]]: List of downloaded file paths
    """
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(safe_download_file, url, path): (url, path)
            for url, path in urls_and_paths
        }
        return [future.result() for future in as_completed(futures)]

def process_video(config: Dict[str, Any], output_filename: str = "output.mp4") -> None:
    """
    Advanced video processing with parallel downloads and robust error handling.
    
    Args:
        config (Dict): Video configuration
        output_filename (str): Output video filename
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            width = config['size']['width']
            height = config['size']['height']
            fps = config['fps']
            
            video_clips, audio_clips = [], []
            download_queue = []
            
            # Parallel media download preparation
            for track_item_id in config['trackItemIds']:
                item = config['trackItemsMap'][track_item_id]
                temp_filename = os.path.join(temp_dir, f"{item['id']}.{item['type']}")
                
                if item['type'] in ['video', 'audio']:
                    download_queue.append((item['details']['src'], temp_filename))
            
            # Parallel download
            downloaded_files = parallel_download(download_queue)
            
            # Process downloaded media
            for track_item_id in config['trackItemIds']:
                item = config['trackItemsMap'][track_item_id]
                media_path = os.path.join(temp_dir, f"{item['id']}.{item['type']}")
                
                try:
                    if item['type'] == 'video':
                        video_clip = VideoFileClip(media_path)
                        video_clip = (video_clip
                                      .subclip(item['trim']['from'] / 1000, item['trim']['to'] / 1000)
                                      .set_opacity(item['details']['opacity'] / 100)
                                      .set_position((
                                          int(item['details']['left'].replace('px', '')), 
                                          int(item['details']['top'].replace('px', ''))
                                      )))
                        video_clips.append(video_clip)
                    
                    elif item['type'] == 'audio':
                        audio_clip = AudioFileClip(media_path)
                        audio_clip = (audio_clip
                                      .subclip(item['trim']['from'] / 1000, item['trim']['to'] / 1000)
                                      .set_start(item['display']['from'] / 1000))
                        
                        if 'volume' in item['details']:
                            audio_clip = audio_clip.volumex(item['details']['volume'] / 100)
                        
                        audio_clips.append(audio_clip)
                    
                    elif item['type'] in ['text', 'caption']:
                        duration = item['display']['to'] - item['display']['from']
                        text_clip = create_text_clip(item, duration, width, height, temp_dir)
                        
                        if text_clip:
                            text_clip = text_clip.set_start(item['display']['from'] / 1000)
                            video_clips.append(text_clip)
                
                except Exception as e:
                    logger.error(f"Error processing {item['type']} clip {item['id']}: {e}")
            
            # Fallback for empty video clips
            if not video_clips:
                blank_duration = max([clip.duration for clip in audio_clips]) if audio_clips else 10
                video_clips.append(ColorClip(size=(width, height), color=(0, 0, 0), duration=blank_duration))
            
            # Final composition
            final_video = CompositeVideoClip(video_clips, size=(width, height))
            
            if audio_clips:
                final_audio = CompositeAudioClip(audio_clips)
                final_video = final_video.set_audio(final_audio)
            
            # Video export with advanced settings
            final_video.write_videofile(
                output_filename,
                fps=fps,
                codec='libx264',
                audio_codec='aac',
                threads=os.cpu_count(),
                preset='medium'
            )
            
            # Resource cleanup
            final_video.close()
            for clip in video_clips + audio_clips:
                clip.close()
        
        except Exception as e:
            logger.error(f"Comprehensive video processing error: {e}")
            raise
