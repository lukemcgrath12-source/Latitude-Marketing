// Client file uploads (no login) for Latitude client upload pages.
// Needs a Vercel Blob store connected to this project (BLOB_READ_WRITE_TOKEN).
const { handleUpload } = require('@vercel/blob/client');

// upload page code -> folder in Blob storage
const CLIENTS = {
  'lps-p4x9': 'uploads/lps-plumbing-group/',
  'setup-r7q4': 'uploads/setup-r7q4/',
};

const TYPES = [
  'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/gif', 'image/svg+xml', 'image/tiff',
  'application/pdf', 'application/postscript', 'application/illustrator', 'application/zip',
  'application/octet-stream', 'video/mp4', 'video/quicktime',
];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const p = JSON.parse(clientPayload || '{}');
        const folder = CLIENTS[p.code];
        if (!folder || !pathname.startsWith(folder) || pathname.includes('..')) throw new Error('Invalid upload link');
        return {
          allowedContentTypes: TYPES,
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Upload failed' });
  }
};
