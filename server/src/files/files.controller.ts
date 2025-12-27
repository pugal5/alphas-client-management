import { Response } from 'express';
import { filesService } from './files.service';
import { AuthRequest } from '../middleware/auth.middleware';
import multer from 'multer';
import { FileType } from '@prisma/client';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  },
});

export class FilesController {
  async uploadFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const options = {
        clientId: req.body.clientId,
        campaignId: req.body.campaignId,
        taskId: req.body.taskId,
      };

      const uploadedFile = await filesService.uploadFile(
        {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        },
        req.user.userId,
        options
      );

      res.status(201).json(uploadedFile);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        userId: req.query.userId as string | undefined,
        clientId: req.query.clientId as string | undefined,
        campaignId: req.query.campaignId as string | undefined,
        taskId: req.query.taskId as string | undefined,
        type: req.query.type as FileType | undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
        take: req.query.take ? parseInt(req.query.take as string) : undefined,
      };

      const result = await filesService.getFiles(filters, req.user.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getFileById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const file = await filesService.getFileById(req.params.id, req.user.userId);
      res.json(file);
    } catch (error) {
      if ((error as Error).message === 'File not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(403).json({ error: (error as Error).message });
    }
  }

  async downloadFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const downloadUrl = await filesService.getDownloadUrl(req.params.id, req.user.userId);
      res.json({ url: downloadUrl });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await filesService.deleteFile(req.params.id, req.user.userId);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const filesController = new FilesController();
export const uploadMiddleware = upload.single('file');

