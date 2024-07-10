const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();
const fs = require("fs");

const client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_PUBLIC_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

async function uploadFile(filepath, filename) {
  const stream = fs.createReadStream(filepath);
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${filename}`,
    Body: stream,
  };

  const putCommand = new PutObjectCommand(uploadParams);

  const putResult = await client.send(putCommand);

  const downloadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${filename}`,
  };

  const getCommand = new GetObjectCommand(downloadParams);
  const downloadUrl = await getSignedUrl(client, getCommand, {
    expiresIn: 300,
  });

  return { putResult, downloadUrl, key: `${filename}` };
}

async function getFiles() {
  const command = new ListObjectsCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
  });
  return await client.send(command);
}

async function getFileDownload(key) {
  if (!key) {
    return { error: "Missing filename" };
  }
  const downloadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };
  const getCommand = new GetObjectCommand(downloadParams);
  const downloadUrl = await getSignedUrl(client, getCommand, {
    expiresIn: 300,
  });

  return { key: key, downloadUrl: downloadUrl };
}

module.exports = {
  uploadFile,
  getFiles,
  getFileDownload,
};
