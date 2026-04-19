const { createClient } = require("@supabase/supabase-js");

let supabaseClient;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured.");
    }

    supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabaseClient;
}

function getBucketName() {
  return process.env.SUPABASE_BUCKET || "notevault-files";
}

function getPublicFileUrl(storagePath) {
  if (process.env.SUPABASE_PUBLIC_BASE_URL) {
    return `${process.env.SUPABASE_PUBLIC_BASE_URL}/${getBucketName()}/${storagePath}`;
  }

  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(getBucketName()).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function createSignedFileUrl(storagePath, expiresIn = 600) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(getBucketName()).createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

async function downloadFileBuffer(storagePath) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(getBucketName()).download(storagePath);

  if (error) {
    throw error;
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = {
  getSupabaseClient,
  getBucketName,
  getPublicFileUrl,
  createSignedFileUrl,
  downloadFileBuffer
};
