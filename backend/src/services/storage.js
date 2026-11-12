import { supabase } from '../config/supabase.js';

const BUCKET_NAME = 'documents';

export async function ensureDocumentsBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw error;
  }

  const exists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });

    if (createError) {
      throw createError;
    }
  }
}

export async function uploadDocumentFile(file, fileName) {
  await ensureDocumentsBucket();

  const path = `${Date.now()}-${fileName}`;
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw error;
  }

  return `${BUCKET_NAME}/${path}`;
}

export async function getSignedUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
