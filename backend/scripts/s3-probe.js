#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * S3 connectivity probe for ops:
 * 1) DNS resolve S3 host
 * 2) HeadBucket
 * 3) GetBucketLocation
 * 4) PutObject
 * 5) Public URL HEAD
 * 6) DeleteObject cleanup
 */

const dns = require('dns').promises;
const {
  S3Client,
  HeadBucketCommand,
  GetBucketLocationCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const bucket = (process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || '').trim();
const region = (process.env.AWS_REGION || '').trim();
const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

const required = {
  AWS_ACCESS_KEY_ID: accessKeyId,
  AWS_SECRET_ACCESS_KEY: secretAccessKey,
  AWS_REGION: region,
  S3_BUCKET_NAME: bucket,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`[s3:probe] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const s3Host = `${bucket}.s3.${region}.amazonaws.com`;
const testKey = `health-check/s3-probe-${Date.now()}.txt`;
const publicUrl = `https://${s3Host}/${testKey}`;
const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

const printStep = (name, value) => {
  console.log(`[s3:probe] ${name}: ${value}`);
};

const fail = (step, error) => {
  const code = error && (error.Code || error.code || error.name || 'UNKNOWN');
  const status = error && error.$metadata && error.$metadata.httpStatusCode
    ? ` status=${error.$metadata.httpStatusCode}`
    : '';
  const message = error && error.message ? error.message : String(error);
  console.error(`[s3:probe] ${step} FAILED (${code}${status}) ${message}`);
};

async function run() {
  let putSucceeded = false;

  printStep('bucket', bucket);
  printStep('region', region);
  printStep('accessKeyPrefix', accessKeyId.slice(0, 4));
  printStep('secretLength', secretAccessKey.length);

  try {
    const dnsRes = await dns.lookup(s3Host);
    printStep('dns', `ok ${dnsRes.address}`);
  } catch (error) {
    fail('dns.lookup', error);
    process.exit(1);
  }

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    printStep('headBucket', 'ok');
  } catch (error) {
    fail('HeadBucket', error);
    process.exit(1);
  }

  try {
    const location = await s3.send(new GetBucketLocationCommand({ Bucket: bucket }));
    const normalized = location.LocationConstraint || 'us-east-1';
    printStep('bucketLocation', normalized);
  } catch (error) {
    fail('GetBucketLocation', error);
    process.exit(1);
  }

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: 'esparex-s3-probe',
        ContentType: 'text/plain',
      })
    );
    putSucceeded = true;
    printStep('putObject', `ok ${testKey}`);
  } catch (error) {
    fail('PutObject', error);
    process.exit(1);
  }

  try {
    const response = await fetch(publicUrl, { method: 'HEAD' });
    printStep('publicHeadStatus', response.status);
    if (!response.ok) {
      console.error(`[s3:probe] Public URL returned non-2xx: ${publicUrl}`);
      process.exit(1);
    }
  } catch (error) {
    fail('public HEAD', error);
    process.exit(1);
  } finally {
    if (putSucceeded) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
        printStep('deleteObject', `ok ${testKey}`);
      } catch (error) {
        fail('DeleteObject', error);
        process.exitCode = 1;
      }
    }
  }

  console.log('[s3:probe] SUCCESS');
}

run().catch((error) => {
  fail('Unhandled', error);
  process.exit(1);
});
