const path = require('path');
const multer = require('multer');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../../docs'));
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  }),
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

function uploadPdfHandler(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded or invalid file type' });
  }
  res.json({ message: 'PDF uploaded successfully', filename: req.file.filename });
}

// Superseded by src/routes/handlers/uploadHandler.ts
module.exports = require('../../src/routes/handlers/uploadHandler');
