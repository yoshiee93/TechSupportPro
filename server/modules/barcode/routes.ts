import { Router } from "express";
import multer from "multer";
import path from "path";
import { barcodeService } from "./barcode-service";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  dest: 'temp/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Ensure temp upload directory exists
import fs from 'fs';
const uploadDir = 'temp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// POST /api/scan-barcode - Process uploaded image for barcode detection
router.post('/scan-barcode', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }

    console.log('Processing barcode image:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Process the uploaded image
    const result = await barcodeService.processImageFile(req.file.path);
    
    // Return result
    res.json(result);
    
    // Log result for debugging
    console.log('Barcode processing result:', result);
    
  } catch (error: any) {
    console.error('Barcode scanning error:', error);
    
    // Clean up uploaded file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to cleanup uploaded file:', err);
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process barcode image'
    });
  }
});

export default router;