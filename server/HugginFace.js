const axios = require('axios');
const { response } = require('express');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const models = {
    "image_gen": [
        "CompVis/stable-diffusion-v1-4",
        "stabilityai/stable-diffusion-2",
        "runwayml/stable-diffusion-v1-5"
    ],
    "tts": [
        "espnet/kan-bayashi_ljspeech_vits",
        "facebook/fastspeech2-en-ljspeech",
        "tts_models/en/ljspeech/tacotron2-DDC",
        "microsoft/speecht5_tts"
    ],
    "summarization": [
        "facebook/bart-large-cnn",
        "sshleifer/distilbart-cnn-12-6",
        "philschmid/bart-large-cnn-samsum"
    ],
    "music": [
        "facebook/musicgen-small",
        "runwayml/stable-diffusion-v1-5-video"
    ]
};
async function try_models(models, prompt, model_index=0) {
    if (model_index >= models.length) {
        throw new Error("All models failed");
    }
    console.log(prompt)
    
    const model = models[model_index];
    const [response, usedModel] = await hugginface_request(model, prompt);
    
    if (response) {
        return [response, usedModel];
    } else {
        return await try_models(models, prompt, model_index + 1);
    }
}
async function hugginface_request(model, text, retries=3) {
    console.log(text)
    for(let i = 0; i < retries; i++) {
        try {
            console.log(`Sending request to model: ${model}`);
            const res = await axios.post(
                `https://api-inference.huggingface.co/models/${model}`,
                { inputs: text },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
                    },
                    responseType: 'arraybuffer'  // Important for binary responses
                }
            );
            
            if (res.status === 200) {
                console.log(`Response received from model: ${model}`);
                // Check content type to ensure we're handling the response correctly
                const contentType = res.headers['content-type'];
                if (contentType && contentType.includes('image')) {
                    return [res.data, model]; // Return binary data directly
                } else {
                    // For non-image responses, convert to base64 if needed
                    return [Buffer.from(res.data).toString('base64'), model];
                }
            } else {
                console.log(`Failed to get response from model: ${model}`);
                return [null, null];
            }
        } catch (error) {
            console.error(`Error calling Hugging Face API (${model}): ${error.message}`);
            if (i === retries - 1) {
                throw new Error(`All retries failed for model ${model}: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    return [null, null];
}

async function ensureUploadsDirectory() {
    const uploadsDir = path.join(__dirname, 'uploads');
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
    }
    return uploadsDir;
}

async function saveFile(buffer, filename, type) {
    const uploadsDir = await ensureUploadsDirectory();
    const filePath = path.join(uploadsDir, filename);
    
    try {
        await fs.writeFile(filePath, buffer);
        console.log(`Successfully saved ${type} to: ${filePath}`);
        
        // Verify file was written correctly
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            throw new Error(`Saved file is empty: ${filename}`);
        }
        
        return filePath;
    } catch (error) {
        throw new Error(`Failed to save ${type}: ${error.message}`);
    }
}
function generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}


async function huggingfaceCall(count, userText, modelType) {
    const selectedModels = models[modelType];
    if (!selectedModels) {
        throw new Error(`Invalid model type: ${modelType}`);
        
    }
    console.log("userText",userText)

    const [response, model] = await try_models(selectedModels, userText);
    if (!response) {
        throw new Error('Failed to get a response from any model');
    }

    let result = [];

    try {
        if (modelType === "image_gen") {
            // Handle image response
            const buffer = Buffer.isBuffer(response) ? response : Buffer.from(response, 'base64');
            const imageId = `${generateId()}.png`;
            const imagePath = await saveFile(buffer, imageId, 'image');
            
            result.push({
                id: imageId,
                name: imageId,
                details: { 
                    src: `/uploads/${imageId}`,
                    model: model,
                    timestamp: new Date().toISOString()
                },
                preview: `/uploads/${imageId}`,
                type: 'image'
            });
        } else if (modelType === "tts" || modelType ==="music") {
            // Handle audio response
            const buffer = Buffer.isBuffer(response) ? response : Buffer.from(response, 'base64');
            const audioId = `${generateId()}.mp3`;
            const audioPath = await saveFile(buffer, audioId, 'audio');
            
            result.push({
                id: audioId,
                name: audioId,
                details: { 
                    src: `/uploads/${audioId}`,
                },
                type: 'audio',
                metadata: {
                    author: "Generated By AI",
                  },
            });
        } else if (modelType === "video_gen") {
            // Handle video response
            const buffer = Buffer.isBuffer(response) ? response : Buffer.from(response, 'base64');
            const videoId = `${generateId()}.mp4`;
            const videoPath = await saveFile(buffer, videoId, 'video');
            
            result.push({
                id: videoId,
                name: videoId,
                details: { 
                    src: `/uploads/${videoId}`,
                    model: model,
                    timestamp: new Date().toISOString()
                },
                preview: `/uploads/${videoId}`,
                type: 'video'
            });
        } 
        
        return result;
    } catch (error) {
        console.error('Error processing response:', error);
        throw new Error(`Failed to process ${modelType} response: ${error.message}`);
    }
}
module.exports = huggingfaceCall;