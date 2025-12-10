"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.uploadPdfHandler = uploadPdfHandler;
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path_1.default.join(__dirname, '../../../../docs'));
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }),
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed!'));
        }
    }
});
exports.upload = upload;
function uploadPdfHandler(req, res) {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }
    res.json({ message: 'PDF uploaded successfully', filename: file.filename });
}
