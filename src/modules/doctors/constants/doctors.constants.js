// Database table for doctor records.
const DOCTORS_TABLE = 'doctors';

// Supabase Storage bucket for doctor profile photos (public-read).
const DOCTOR_PHOTOS_BUCKET = 'doctor-photos';

// Max upload size for a doctor photo: 2 MB.
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

// Accepted image mime types mapped to the file extension used in storage.
const ALLOWED_PHOTO_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

module.exports = {
  DOCTORS_TABLE,
  DOCTOR_PHOTOS_BUCKET,
  MAX_PHOTO_BYTES,
  ALLOWED_PHOTO_MIME,
};
