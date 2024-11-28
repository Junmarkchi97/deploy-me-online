import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// Or use Cloudflare R2 which is similar to S3

export async function uploadToStorage(files: Buffer, key: string) {
  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: files,
    ContentType: 'text/html',
  }));
}