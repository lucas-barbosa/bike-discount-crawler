import aws from 'aws-sdk'
import axios from "axios";
import { PassThrough } from "node:stream";
import { DIGITAL_OCEAN } from '../config';

import { logger } from '../utils/logger';

const s3 = new aws.S3({
  endpoint: new aws.Endpoint('https://nyc3.digitaloceanspaces.com'),
  accessKeyId: DIGITAL_OCEAN.ACCESS_KEY,
  secretAccessKey: DIGITAL_OCEAN.SECRET_KEY
});

const uploadImageFromUrl = async (url: string) => {
  const key = encodeURIComponent(url);
  try {
    // Fetch the image from the URL
    const response = await axios({
      url,
      responseType: 'stream',
    });

    // Create a PassThrough stream to pipe the image data
    const passThroughStream = new PassThrough();
    response.data.pipe(passThroughStream);

    // Upload the image to DigitalOcean Space
    const result = await s3.upload({
      ACL: 'public-read',
      Bucket: DIGITAL_OCEAN.BUCKET_NAME,
      Key: key,
      Body: passThroughStream,
      ContentType: response.headers['content-type'] as string, // Set the correct MIME type
    }).promise();
    return result.Location;
  } catch (error: any) {
    logger.error({ err: error }, 'Error uploading image');
    return null;
  }
}

export const uploadImages = async (images: string[]) => {
  if (!images?.length) {
    return [];
  }

  const result: string[] = [];
  for (const url of images) {
    const uploadedUrl = await uploadImageFromUrl(url);
    if (uploadedUrl) {
      result.push(uploadedUrl);
    }
  }

  return result;
};
