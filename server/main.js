const { bundle } = require('@remotion/bundler');
const { renderMediaOnLambda, deploySite } = require('@remotion/lambda');
const path = require('path');
const { getRenderProgress } =require( '@remotion/lambda/client');

require('dotenv').config();

// Sample data moved to a separate constant
async function renderVideo_OnLambda(data) {
  // AWS configuration
  const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1'
  };

  // Bundle the Remotion composition
  const bundleLocation = await bundle({
    entryPoint: path.join(__dirname, './src/index.tsx'),
    webpackConfigOverride: (config) => config
  });

  // Deploy the site
  const serveUrl = await deploySite({
    entryPoint: path.join(__dirname, './src/index.tsx'),
    siteName: `my-video`,
    region: awsConfig.region,
    bucketName: "remotionlambda-useast1-lzpwujo86o",
    privacy: 'no-acl'
  });

  console.log('Deployed site:', serveUrl.serveUrl);
  
  // Lambda render configuration
  const renderJob = await renderMediaOnLambda({
    ...awsConfig,
    functionName: 'remotion-render-4-0-229-mem2048mb-disk2048mb-120sec',
    composition: 'VideoComposition', // Directly specify the composition ID
    framesPerLambda: 30,
    inputProps: { data },
    serveUrl: serveUrl.serveUrl,
    codec: 'h264',
    privacy: 'no-acl',
    height: 1920,
    width: 1080
  });

  console.log('Render Job Details:', renderJob);
  return renderJob;
}
async function getStatus(renderId) {
  try {
      const progress = await getRenderProgress({
          renderId: renderId,
          bucketName: 'remotionlambda-useast1-lzpwujo86o',
          functionName: 'remotion-render-4-0-229-mem2048mb-disk2048mb-120sec',
          region: 'us-east-1',
      });
      return progress; // Return the progress object
  } catch (error) {
      console.error('Error getting render progress:', error);
      throw error; // Rethrow the error to be handled by the API route
  }
}

module.exports = { renderVideo_OnLambda,getStatus };