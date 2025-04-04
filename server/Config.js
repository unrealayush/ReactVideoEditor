const dotenv = require('dotenv');
dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    aws: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucketName: process.env.S3_NAME
    },
    cloudfront: {
        domain: "https://dwq6jrynran28.cloudfront.net"
    },
    ffmpeg: {
        ffmpegPath: "C:/Users/saedi/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe",
        ffprobePath: "C:/Users/saedi/Downloads/ffmpeg-master-latest-win64-gpl/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe"
    },
    allowedExtensions: {
        image: ['png', 'jpg', 'jpeg', 'gif'],
        video: ['mp4', 'mov', 'avi', 'mkv'],
        audio: ['mp3', 'wav', 'ogg']
    }
};

module.exports = config;