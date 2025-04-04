from flask import Flask, render_template, request, redirect, url_for, flash,jsonify
from flask_cors import CORS
import boto3
from flask import send_file
import os
import dotenv
import cv2
from awss3 import process_video
import tempfile
import logging
from werkzeug.utils import secure_filename
import io
import whisper
import torch
from datetime import timedelta
import requests
from urllib.parse import urlparse
import validators

import shutil

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

dotenv.load_dotenv()
app = Flask(__name__)
CORS(app)

# Initialize S3 client
s3_client = boto3.client('s3',
    aws_access_key_id="AKIAQXUIXJ53XBJLP4GC",
    aws_secret_access_key=os.getenv('SECRETKEY'),
    region_name=os.getenv('SERVER_ADDR')
)

BUCKET_NAME = os.getenv('S3_NAME')
S3_REGION = os.getenv('SERVER_ADDR')
ALLOWED_EXTENSIONS_IMG = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_EXTENSIONS_VID = {'mp4', 'mov', 'avi', 'mkv'}
ALLOWED_EXTENSIONS_AUD= {'mp3', 'wav', 'ogg'}
CLOUDFRONT_DOMAIN = 'https://dwq6jrynran28.cloudfront.net'
WHISPER_MODEL = "base"
model = whisper.load_model(WHISPER_MODEL)

def format_timestamp(seconds):
    """Convert seconds to SRT timestamp format"""
    td = timedelta(seconds=seconds)
    hours = td.seconds//3600
    minutes = (td.seconds//60)%60
    seconds = td.seconds%60
    milliseconds = int(td.microseconds/1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

def create_srt(segments):
    """Convert Whisper segments to SRT format"""
    srt_content = []
    for i, segment in enumerate(segments, start=1):
        start_time = format_timestamp(segment['start'])
        end_time = format_timestamp(segment['end'])
        text = segment['text'].strip()
        
        srt_entry = f"{i}\n{start_time} --> {end_time}\n{text}\n\n"
        srt_content.append(srt_entry)
    
    return "".join(srt_content)

def download_video(url):
    """Download video from URL to temporary file"""
    try:
        # Validate URL
        if not validators.url(url):
            raise ValueError("Invalid URL provided")
            
        # Create temporary file for video
        suffix = os.path.splitext(urlparse(url).path)[1]
        if not suffix:
            suffix = '.mp4'  # Default extension if none found
            
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        
        # Download with stream=True to handle large files
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        # Get content type to verify it's a video
        content_type = response.headers.get('content-type', '')
        if not any(vid_type in content_type.lower() for vid_type in ['video/', 'audio/']):
            raise ValueError(f"Invalid content type: {content_type}")
            
        # Write the file in chunks
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                temp_file.write(chunk)
                
        temp_file.close()
        return temp_file.name, os.path.basename(urlparse(url).path)
        
    except requests.RequestException as e:
        raise Exception(f"Failed to download video: {str(e)}")


@app.route('/api/transcribe/url', methods=['POST'])
def transcribe_from_url():
    temp_files = []  # Keep track of temporary files to clean up
    try:
        logger.debug("Starting transcription process from URL")
        
        # Get video URL from request
        data = request.get_json()
        if not data or 'url' not in data:
            return {'error': 'No video URL provided'}, 400
            
        video_url = data.get('url')
        language = data.get('language', 'en')
        
        # Download the video
        logger.debug(f"Downloading video from: {video_url}")
        temp_video_path, original_filename = download_video(video_url)
        temp_files.append(temp_video_path)

        
        # Transcribe the audio
        logger.debug(f"Starting transcription for video: {original_filename}")
        result = model.transcribe(
            temp_video_path,
            language=language,
            verbose=False,
            word_timestamps=True  # Enable word-level timestamps
        )
        
        # Process segments to include word-level information
        processed_segments = []
        for segment in result['segments']:
            processed_segment = {
                'start': int(segment['start'] * 1000),  # Convert to milliseconds
                'end': int(segment['end'] * 1000),
                'text': segment['text'].strip(),
                'words': []
            }
            
            # Process word-level timing if available
            if 'words' in segment:
                for word in segment['words']:
                    processed_segment['words'].append({
                        'start': int(word['start'] * 1000),
                        'end': int(word['end'] * 1000),
                        'word': word['word']
                    })
            
            processed_segments.append(processed_segment)

        response_data = {
            'success': True,
            'segments': processed_segments,
            'language': result['language'],
            'original_video': video_url
        }

        return response_data

    except Exception as e:
        logger.error(f"Transcription error: {str(e)}", exc_info=True)
        return {'error': str(e)}, 500
        
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {temp_file}: {str(e)}")
def save_uploaded_file(file):
    """Save uploaded file to a temporary file and return the path"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
    file.save(temp_file.name)
    temp_file.close()
    return temp_file.name

def extract_thumbnail(video_path):
    """Extract first frame from video and save as thumbnail"""
    try:
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise Exception("Failed to open video file with OpenCV")
        
        ret, frame = cap.read()
        if not ret:
            raise Exception("Failed to read frame from video")
            
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Calculate duration
        duration = frame_count / fps
        # Create temporary file for thumbnail
        temp_thumb = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        temp_thumb_path = temp_thumb.name
        temp_thumb.close()
        
        # Save frame as JPEG
        success = cv2.imwrite(temp_thumb_path, frame)
        if not success:
            raise Exception("Failed to save thumbnail")
        
        logger.debug(f"Successfully created thumbnail at: {temp_thumb_path}")
        
        # Clean up
        cap.release()
        
        return temp_thumb_path,duration
        
    except Exception as e:
        logger.error(f"Error in extract_thumbnail: {str(e)}")
        if 'temp_thumb_path' in locals():
            try:
                os.unlink(temp_thumb_path)
            except:
                pass
        raise

def upload_to_s3(file_path, s3_path, content_type):
    """Upload file to S3 and return CloudFront URL"""
    try:
        logger.debug(f"Uploading to S3: {s3_path} with content type: {content_type}")
        
        with open(file_path, 'rb') as file_obj:
            s3_client.upload_fileobj(
                file_obj,
                BUCKET_NAME,
                s3_path,
                ExtraArgs={
                    'ContentType': content_type,
                    'CacheControl': 'max-age=31536000'
                }
            )
        url = f"{CLOUDFRONT_DOMAIN}/{s3_path}"
        logger.debug(f"Successfully uploaded to S3, URL: {url}")
        return url
    except Exception as e:
        logger.error(f"S3 upload failed: {str(e)}")
        raise

@app.route('/api/upload', methods=['POST'])
def upload():
    temp_files = []  # Keep track of temporary files to clean up
    try:
        logger.debug("Starting upload process")
        
        if 'files' not in request.files:
            logger.error("No file in request")
            return {'error': 'No file provided'}, 400
            
        file = request.files['files']
        if file.filename == '':
            logger.error("Empty filename")
            return {'error': 'No file selected'}, 400
            
        filename = secure_filename(file.filename)
        extension = filename.split('.')[-1].lower()
        
        logger.debug(f"Processing file: {filename} with extension: {extension}")
        
        # Save uploaded file to temporary location
        temp_file_path = save_uploaded_file(file)
        temp_files.append(temp_file_path)
        
        # Upload original file
        path = f'images/{filename}'
        file_url = upload_to_s3(temp_file_path, path, file.content_type)
        
        if extension in ALLOWED_EXTENSIONS_IMG:
            logger.debug("Processing as image")
            return {
                'id': filename,
                'name':filename,
                'details': {'src': file_url},
                'preview': file_url,
                'type': "image",
            }
        elif extension in ALLOWED_EXTENSIONS_VID:
            logger.debug("Processing as video")
            # Extract thumbnail
            thumb_path,duration = extract_thumbnail(temp_file_path)
            temp_files.append(thumb_path)
            
            thumb_filename = f"{filename.rsplit('.', 1)[0]}_thumb.jpg"
            thumb_url = upload_to_s3(
                thumb_path,
                f'images/{thumb_filename}',
                'image/jpeg'
            )
            
            return {
                'id': filename,
                'name':filename,
                'details': {'src': file_url},
                'preview': thumb_url,
                'type': "video",
                'duration': duration
            }
        elif extension in ALLOWED_EXTENSIONS_AUD:
            logger.debug("Processing as audio")
            return {
                'id': filename,
                'name':filename,
                'details': {'src': file_url},
                'preview': file_url,
                'type': "audio",
                "metadata": {
                    "author": "User",
                    },
            }
        else:
            logger.error(f"Unsupported file extension: {extension}")
            return {'error': 'Unsupported file type'}, 400
            
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        return {'error': str(e)}, 500
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {temp_file}: {str(e)}")





if __name__ == '__main__':
    app.run(debug=True)