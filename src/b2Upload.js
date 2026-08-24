async function hmac(key, message) {
  const gKey = typeof key === 'string' 
    ? new TextEncoder().encode(key) 
    : key;
  const gMessage = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message;
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    gKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    gMessage
  );
  return new Uint8Array(signature);
}

async function sha256(message) {
  const gMessage = typeof message === 'string' 
    ? new TextEncoder().encode(message) 
    : message;
  const hash = await window.crypto.subtle.digest('SHA-256', gMessage);
  return new Uint8Array(hash);
}

function hex(uint8Array) {
  return Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadToB2({ file, fileName, credentials }) {
  const { bucketName, endpoint, keyId, applicationKey } = credentials;
  
  // Clean endpoint: e.g. "s3.us-west-004.backblazeb2.com"
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, '').trim();
  const host = `${bucketName}.${cleanEndpoint}`;
  const url = `https://${host}/${fileName}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateStamp = amzDate.substring(0, 8);

  // Extract region from B2 endpoint (usually s3.<region>.backblazeb2.com)
  let region = 'us-east-1';
  const match = cleanEndpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/);
  if (match && match[1]) {
    region = match[1];
  }

  // Calculate payload hash
  const fileBuffer = await file.arrayBuffer();
  const fileHash = hex(await sha256(fileBuffer));

  // S3 V4 Canonical Request
  const method = 'PUT';
  const canonicalUri = `/${encodeURIComponent(fileName)}`;
  const canonicalQueryString = '';
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${fileHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${fileHash}`;
  const canonicalRequestHash = hex(await sha256(canonicalRequest));

  // String to Sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  // Derive signing key
  const kSecret = `AWS4${applicationKey}`;
  const kDate = await hmac(kSecret, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');

  // Compute Signature
  const signature = hex(await hmac(kSigning, stringToSign));

  // Authorization Header
  const authorization = `${algorithm} Credential=${keyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // Execute Upload
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': fileHash,
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: fileBuffer
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`B2 Upload failed (${response.status}): ${errorText}`);
  }

  return url;
}
