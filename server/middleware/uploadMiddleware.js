const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Ensure uploads directory exists ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Storage Configuration ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize original filename
    const sanitized = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');

    // Build unique filename: timestamp-random-sanitized.ext
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(sanitized).toLowerCase();
    const baseName = path.basename(sanitized, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// ─── File Filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt',
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type '${ext}'. Allowed: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX, TXT`
      ),
      false
    );
  }
};

// ─── Multer Instance ──────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 3,                   // max 3 files per request
  },
});

// ─── Upload Middlewares ───────────────────────────────────────────────────────

// For complaint attachments (up to 3 files)
const uploadComplaintFiles = upload.array('attachments', 3);

// For avatar/profile picture (single file)
const uploadAvatar = upload.single('avatar');

// ─── Wrapper with error handling ──────────────────────────────────────────────
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      let message = 'File upload error';
      if (err.code === 'LIMIT_FILE_SIZE')  message = 'File too large. Max size is 5MB per file.';
      if (err.code === 'LIMIT_FILE_COUNT') message = 'Too many files. Maximum 3 files allowed.';
      if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Unexpected file field name.';
      return res.status(400).json({ success: false, message });
    } else if (err) {
      // Custom file filter errors
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ─── Helper: delete a file from disk ─────────────────────────────────────────
const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  uploadComplaintFiles: handleUpload(uploadComplaintFiles),
  uploadAvatar: handleUpload(uploadAvatar),
  deleteFile,
};