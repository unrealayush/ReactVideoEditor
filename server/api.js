const cors = require("cors");
const express = require("express");
const { renderVideo_OnLambda, getStatus } = require("./main");
const multer = require('multer');
const AWS = require('aws-sdk');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const axios = require('axios');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const dotenv = require('dotenv');
const huggingfaceCall=require("./HugginFace")
const os =require("os")
const ffmpeg = require('fluent-ffmpeg');

// Load environment variables
dotenv.config();

ffmpeg.setFfmpegPath("C:/Users/saedi/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("C:/Users/saedi/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe");

// Initialize Express app
const app = express();

// Configure AWS S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Constants
const BUCKET_NAME = process.env.S3_NAME;
const CLOUDFRONT_DOMAIN = "https://dwq6jrynran28.cloudfront.net";
const ALLOWED_EXTENSIONS_IMG = ['png', 'jpg', 'jpeg', 'gif'];
const ALLOWED_EXTENSIONS_VID = ['mp4', 'mov', 'avi', 'mkv'];
const ALLOWED_EXTENSIONS_AUD = ['mp3', 'wav', 'ogg'];
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configure multer
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Helper Functions
const uploadToS3 = async (filePath, s3Path, contentType) => {
    try {
        const fileContent = await fsp.readFile(filePath);
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Path,
            Body: fileContent,
            ContentType: contentType,
            CacheControl: 'max-age=31536000'
        });

        await s3Client.send(command);
        return `${CLOUDFRONT_DOMAIN}/${s3Path}`;
    } catch (error) {
        console.error('S3 upload error:', error);
        throw error;
    }
};

const extractThumbnail = (videoPath) => {
    return new Promise((resolve, reject) => {
        const thumbnailFileName = `thumbnail_${uuidv4()}.jpg`;
        const thumbnailPath = path.join(uploadsDir, thumbnailFileName);

        ffmpeg(videoPath)
            .screenshots({
                count: 1,
                filename: thumbnailFileName,
                folder: uploadsDir,
                size: '320x240'
            })
            .on('end', () => {
                ffmpeg.ffprobe(videoPath, (err, metadata) => {
                    if (err) return reject(err);
                    resolve({
                        thumbnailPath,
                        duration: metadata.format.duration
                    });
                });
            })
            .on('error', reject);
    });
};

const downloadVideo = async (url) => {
    if (!validator.isURL(url)) {
        throw new Error('Invalid URL');
    }

    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });

    const contentType = response.headers['content-type'];
    if (!contentType.includes('video/') && !contentType.includes('audio/')) {
        throw new Error(`Invalid content type: ${contentType}`);
    }

    const extension = path.extname(url) || '.mp4';
    const videoPath = path.join(uploadsDir, `video_${uuidv4()}${extension}`);
    
    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(videoPath));
        writer.on('error', reject);
    });
};

const transcribeVideo = async (videoPath, language = 'en') => {
    return new Promise((resolve, reject) => {
        const whisperProcess = spawn('whisper', [
            videoPath,
            '--model', 'base',
            '--output_dir', uploadsDir,
            '--output_format', 'json',
            '--language', language,
            '--word_timestamps', 'true'
        ]);

        let stdout = '';
        let stderr = '';

        whisperProcess.stdout.on('data', (data) => {
            stdout += data;
            console.log(`Whisper stdout: ${data}`);
        });

        whisperProcess.stderr.on('data', (data) => {
            stderr += data;
            console.error(`Whisper stderr: ${data}`);
        });

        whisperProcess.on('close', async (code) => {
            if (code === 0) {
                try {
                    const jsonPath = videoPath.replace(/\.[^/.]+$/, '.json');
                    const transcriptionData = await fsp.readFile(jsonPath, 'utf8');
                    const result = JSON.parse(transcriptionData);
                    
                    const processedSegments = result.segments.map(segment => ({
                        start: Math.round(segment.start * 1000),
                        end: Math.round(segment.end * 1000),
                        text: segment.text.trim(),
                        words: segment.words ? segment.words.map(word => ({
                            start: Math.round(word.start * 1000),
                            end: Math.round(word.end * 1000),
                            word: word.word
                        })) : []
                    }));

                    resolve({
                        success: true,
                        segments: processedSegments,
                        language: result.language || language
                    });

                    // Cleanup JSON file
                    fsp.unlink(jsonPath).catch(console.error);
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error(`Whisper process failed: ${stderr}`));
            }
        });
    });
};

// Routes
app.post("/render", async (req, res) => {
    try {
        const data = req.body;
        console.log("Received data:", data);
        
        const response = await renderVideo_OnLambda(data);
        console.log("Lambda response:", response);
        
        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.get("/status/:renderId", async (req, res) => {
    try {
        const { renderId } = req.params;
        const result = await getStatus(renderId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.post('/api/upload', upload.single('files'), async (req, res) => {
    let uploadedFile = null;
    let thumbnailPath = null;

    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        uploadedFile = file.path;
        const filename = `${uuidv4()}-${file.originalname}`;
        const extension = path.extname(filename).toLowerCase().slice(1);
        const s3Path = `uploads/${filename}`;

        let responseData;

        if (ALLOWED_EXTENSIONS_IMG.includes(extension)) {
            const fileUrl = await uploadToS3(uploadedFile, s3Path, file.mimetype);
            responseData = {
                id: filename,
                name: file.originalname,
                details: { src: fileUrl },
                preview: fileUrl,
                type: 'image'
            };
        } else if (ALLOWED_EXTENSIONS_VID.includes(extension)) {
            const { thumbnailPath: thumbPath, duration } = await extractThumbnail(uploadedFile);
            thumbnailPath = thumbPath;

            const fileUrl = await uploadToS3(uploadedFile, s3Path, file.mimetype);
            const thumbS3Path = `uploads/thumbnails/${path.basename(thumbnailPath)}`;
            const thumbUrl = await uploadToS3(thumbnailPath, thumbS3Path, 'image/jpeg');

            responseData = {
                id: filename,
                name: file.originalname,
                details: { src: fileUrl },
                preview: thumbUrl,
                type: 'video',
                duration
            };
        } else if (ALLOWED_EXTENSIONS_AUD.includes(extension)) {
            const fileUrl = await uploadToS3(uploadedFile, s3Path, file.mimetype);
            responseData = {
                id: filename,
                name: file.originalname,
                details: { src: fileUrl },
                preview: '/audio-placeholder.png', // Add a default audio preview image
                type: 'audio'
            };
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        res.json(responseData);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Upload failed' });
    } finally {
        // Clean up files
        if (uploadedFile) {
            fsp.unlink(uploadedFile).catch(err => console.error('Error deleting uploaded file:', err));
        }
        if (thumbnailPath) {
            fsp.unlink(thumbnailPath).catch(err => console.error('Error deleting thumbnail:', err));
        }
    }
});
async function processAudioWithFFmpeg(inputPath) {
    const outputPath = inputPath.replace(/\.[^/.]+$/, '') + '_processed.mp4';
    
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', inputPath,        // Input file
            '-vn',                  // Disable video recording
            '-ar', '44100',         // Set audio sample rate to 44100Hz
            '-ac', '2',             // Set 2 audio channels (stereo)
            '-b:a', '192k',         // Set audio bitrate to 192k
            '-y',                   // Overwrite output file if it exists
            outputPath              // Output file
        ]);

        // Log FFmpeg output for debugging
        ffmpeg.stderr.on('data', (data) => {
            console.log(`FFmpeg: ${data}`);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log(`Audio processed successfully: ${outputPath}`);
                resolve(outputPath);
            } else {
                reject(new Error(`FFmpeg process exited with code ${code}`));
            }
        });

        ffmpeg.on('error', (err) => {
            reject(new Error(`FFmpeg process error: ${err.message}`));
        });
    });
}

app.post('/api/generate/media', async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        const {
            prompt,
            modelType = "image_gen",
            count = 1
        } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Get generated media from Hugging Face
        const result = await huggingfaceCall(count, prompt, modelType);
        if (!result || !result.length) {
            throw new Error('No media generated from Hugging Face');
        }

        // Process each generated media item
        const processedResults = await Promise.all(result.map(async (item) => {
            try {
                // Get the filename from the src path
                const filename = path.basename(item.details.src);
                
                // Construct the correct full path in the uploads directory
                const sourcePath = path.join(uploadsDir, filename);
                
                console.log('Checking file at path:', sourcePath);
                
                // Verify file exists
                try {
                    await fsp.access(sourcePath);
                } catch (error) {
                    console.error(`File not found at ${sourcePath}`);
                    throw new Error(`Generated file not found at expected location: ${sourcePath}`);
                }

                // Generate a unique filename for S3
                const uniqueId = uuidv4();
                const extension = path.extname(filename) || '.jpg';
                const s3Key = `images/${uniqueId}${extension}`;
                let cloudFrontUrl=null
                if(modelType === "image_gen"){
                    cloudFrontUrl = await uploadToS3(
                        sourcePath,
                        s3Key,
                        'image/jpeg'
                    );
                    await fsp.unlink(sourcePath).catch(err => 
                        console.warn(`Failed to delete temporary file ${sourcePath}:`, err)
                    );
                    return {
                        id: uniqueId,
                        details:{
                            src:cloudFrontUrl
                        },
                        preview:cloudFrontUrl+"?tr=w-190",
                        type: item.type,
                        
    
                    }
    
                }
                else{
                    const processedPath = await processAudioWithFFmpeg(sourcePath);

                    cloudFrontUrl = await uploadToS3(
                        processedPath,
                        s3Key,
                        'video/mp4'
                    );
                    await fsp.unlink(sourcePath).catch(err => 
                        console.warn(`Failed to delete temporary file ${sourcePath}:`, err)
                    );
                    return {
                        id: uniqueId,
                        details:{
                            src:cloudFrontUrl
                        },
                        name:prompt,
                        type: modelType,
                        metadata: {
                            author: "Generated by AI",
                        }
                        
    
                    }
    
                }
                // Clean up local file
                
                return {
                    id: uniqueId,
                    details:{
                        src:cloudFrontUrl
                    },
                    preview:cloudFrontUrl+"?tr=w-190",
                    type: item.type,
                    

                }
            } catch (error) {
                console.error(`Error processing media item:`, error);
                throw error;
            }
        }));

        res.json(processedResults);
    } catch (error) {
        console.error('Generate media error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate and upload media',
            details: error.stack
        });
    }
});
app.post('/api/transcribe/url', async (req, res) => {
    let videoPath;
    try {
        const { url, language = 'en' } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'No video URL provided' });
        }

        videoPath = await downloadVideo(url);
        const transcriptionResult = await transcribeVideo(videoPath, language);

        res.json({
            ...transcriptionResult,
            original_video: url
        });
    } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: error.message || 'Transcription failed' });
    } finally {
        if (videoPath) {
            fsp.unlink(videoPath).catch(err => 
                console.warn('Failed to delete video file:', err)
            );
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});