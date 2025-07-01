import type { Express } from "express";
import multer from "multer";
import sharp from "sharp";
import { requireAuth } from "../../auth";
import { storage } from "../../storage";
import path from "path";
import fs from "fs/promises";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Ensure uploads directory exists
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

export function registerAttachmentRoutes(app: Express) {
  // Upload image attachment
  app.post("/api/attachments/upload", requireAuth, upload.single('image'), async (req, res) => {
    try {
      // console.log("File upload request received");
      // console.log("User:", (req as any).user);
      // console.log("File:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "No file");
      // console.log("Body:", req.body);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { ticketId, description = '', type = 'device_photo' } = req.body;
      
      if (!ticketId) {
        return res.status(400).json({ message: "Ticket ID is required" });
      }

      const uploadDir = await ensureUploadDir();
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const filepath = path.join(uploadDir, filename);

      // Process and compress image using Sharp
      await sharp(req.file.buffer)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      // Save attachment metadata to database
      const attachment = await storage.createAttachment({
        ticketId: parseInt(ticketId),
        filename,
        originalName: req.file.originalname,
        mimetype: 'image/webp',
        size: (await fs.stat(filepath)).size,
        description,
        type,
        uploadedBy: (req as any).user?.id || 'unknown'
      });

      res.status(201).json({
        id: attachment.id,
        filename: attachment.filename,
        originalName: attachment.originalName,
        description: attachment.description,
        type: attachment.type,
        url: `/api/attachments/${attachment.id}/file`,
        uploadedAt: attachment.createdAt
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        message: "Failed to upload file", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get attachments for a ticket
  app.get("/api/tickets/:ticketId/attachments", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const attachments = await storage.getAttachmentsByTicket(ticketId);
      
      const attachmentsWithUrls = attachments.map(attachment => ({
        ...attachment,
        url: `/api/attachments/${attachment.id}/file`,
        thumbnailUrl: `/api/attachments/${attachment.id}/thumbnail`
      }));

      res.json(attachmentsWithUrls);
    } catch (error) {
      console.error('Get attachments error:', error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  // Serve attachment file
  app.get("/api/attachments/:id/file", requireAuth, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      const uploadDir = await ensureUploadDir();
      const filepath = path.join(uploadDir, attachment.filename);

      // Check if file exists
      try {
        await fs.access(filepath);
      } catch {
        return res.status(404).json({ message: "File not found" });
      }

      res.setHeader('Content-Type', attachment.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
      res.sendFile(filepath);

    } catch (error) {
      console.error('Serve file error:', error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Serve thumbnail
  app.get("/api/attachments/:id/thumbnail", requireAuth, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      const uploadDir = await ensureUploadDir();
      const filepath = path.join(uploadDir, attachment.filename);
      const thumbnailPath = path.join(uploadDir, `thumb_${attachment.filename}`);

      // Generate thumbnail if it doesn't exist
      try {
        await fs.access(thumbnailPath);
      } catch {
        await sharp(filepath)
          .resize(200, 200, { fit: 'cover' })
          .webp({ quality: 70 })
          .toFile(thumbnailPath);
      }

      res.setHeader('Content-Type', 'image/webp');
      res.sendFile(thumbnailPath);

    } catch (error) {
      console.error('Serve thumbnail error:', error);
      res.status(500).json({ message: "Failed to serve thumbnail" });
    }
  });

  // Delete attachment
  app.delete("/api/attachments/:id", requireAuth, async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getAttachment(attachmentId);
      
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      // Delete file from filesystem
      const uploadDir = await ensureUploadDir();
      const filepath = path.join(uploadDir, attachment.filename);
      const thumbnailPath = path.join(uploadDir, `thumb_${attachment.filename}`);

      try {
        await fs.unlink(filepath);
        await fs.unlink(thumbnailPath).catch(() => {}); // Ignore if thumbnail doesn't exist
      } catch (error) {
        console.error('File deletion error:', error);
      }

      // Delete from database
      await storage.deleteAttachment(attachmentId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete attachment error:', error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });
}