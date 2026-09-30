const multer = require('multer');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '../../frontend/uploads');
const folders = ['hero', 'categories', 'services'];
folders.forEach(folder => fs.mkdirSync(path.join(root, folder), { recursive: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(root, req.uploadFolder || 'services')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    cb(null, `${Date.now()}-${base || 'image'}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|jpg)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, JPEG, PNG and WEBP images are allowed.'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});
