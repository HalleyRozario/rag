import path from 'path';
import multer from 'multer';
import { Request, Response } from 'express';

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
      cb(null, path.join(__dirname, '../../../../docs'));
    },
    filename: function (req: any, file: any, cb: any) {
      cb(null, file.originalname);
    }
  }),
  fileFilter: function (req: any, file: any, cb: any) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

function uploadPdfHandler(req: Request, res: Response) {
  const file: any = (req as any).file;
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded or invalid file type' });
  }
  res.json({ message: 'PDF uploaded successfully', filename: file.filename });
}

export { upload, uploadPdfHandler };
