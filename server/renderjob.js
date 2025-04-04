import { getRenderProgress } from '@remotion/lambda/client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const progress = await getRenderProgress({
  renderId: '2egd1jtsfs',
  bucketName: 'remotionlambda-useast1-lzpwujo86o',
  functionName: 'remotion-render-4-0-229-mem2048mb-disk2048mb-120sec',
  region: 'us-east-1',
});
console.log(progress);
