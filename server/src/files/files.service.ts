import { Prisma, FileType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { rbacService } from '../rbac/rbac.service.js';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const s3 = process.env.AWS_ACCESS_KEY_ID
  ? new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    })
  : null;

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(',');

export interface UploadFileData {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface CreateFileData {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: FileType;
  userId: string;
  clientId?: string;
  campaignId?: string;
  taskId?: string;
  parentId?: string;
}

function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel')) return 'document';
  return 'other';
}

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (!s3) {
    throw new Error('S3 not configured');
  }

  const params: AWS.S3.PutObjectRequest = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'private',
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

async function uploadLocal(buffer: Buffer, filename: string): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `/uploads/${filename}`;
}

export class FilesService {
  async uploadFile(data: UploadFileData, userId: string, options: {
    clientId?: string;
    campaignId?: string;
    taskId?: string;
  }): Promise<any> {
    // Validate file size
    if (data.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(data.mimetype)) {
      throw new Error(`File type ${data.mimetype} is not allowed`);
    }

    // Check permissions
    if (options.clientId) {
      const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', options.clientId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    if (options.campaignId) {
      const hasAccess = await rbacService.checkResourceAccess(userId, 'campaigns', options.campaignId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    if (options.taskId) {
      const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', options.taskId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    // Generate unique filename
    const fileExtension = path.extname(data.filename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const fileType = getFileType(data.mimetype);

    // Upload file
    let url: string;
    if (s3 && process.env.AWS_S3_BUCKET) {
      url = await uploadToS3(data.buffer, uniqueFilename, data.mimetype);
    } else {
      url = await uploadLocal(data.buffer, uniqueFilename);
    }

    // Create file record
    const file = await prisma.file.create({
      data: {
        filename: uniqueFilename,
        originalName: data.filename,
        mimeType: data.mimetype,
        size: data.size,
        type: fileType,
        url,
        userId,
        clientId: options.clientId,
        campaignId: options.campaignId,
        taskId: options.taskId,
      },
    });

    return file;
  }

  async getFiles(filters: {
    userId?: string;
    clientId?: string;
    campaignId?: string;
    taskId?: string;
    type?: FileType;
    skip?: number;
    take?: number;
  }, requestingUserId: string): Promise<{ files: any[]; total: number }> {
    const where: Prisma.FileWhereInput = {
      deletedAt: null,
    };

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
      // Check permission
      const hasAccess = await rbacService.checkResourceAccess(requestingUserId, 'clients', filters.clientId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    if (filters.campaignId) {
      where.campaignId = filters.campaignId;
      const hasAccess = await rbacService.checkResourceAccess(requestingUserId, 'campaigns', filters.campaignId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    if (filters.taskId) {
      where.taskId = filters.taskId;
      const hasAccess = await rbacService.checkResourceAccess(requestingUserId, 'tasks', filters.taskId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.file.count({ where }),
    ]);

    return { files, total };
  }

  async getFileById(id: string, userId: string): Promise<any> {
    const file = await prisma.file.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Check permissions
    if (file.clientId) {
      const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', file.clientId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    if (file.campaignId) {
      const hasAccess = await rbacService.checkResourceAccess(userId, 'campaigns', file.campaignId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    if (file.taskId) {
      const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', file.taskId, 'read');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    return file;
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const file = await prisma.file.findFirst({
      where: { id, deletedAt: null },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Check permissions - user can delete their own files or if they have access to the resource
    if (file.userId !== userId) {
      if (file.clientId) {
        const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', file.clientId, 'delete');
        if (!hasAccess) {
          throw new Error('Insufficient permissions');
        }
      } else {
        throw new Error('Insufficient permissions');
      }
    }

    // Soft delete
    await prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Optionally delete from storage (S3 or local)
    // For now, we'll keep files in storage for recovery
  }

  async getDownloadUrl(id: string, userId: string): Promise<string> {
    const file = await this.getFileById(id, userId);

    if (s3 && process.env.AWS_S3_BUCKET) {
      // Generate presigned URL for S3
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: file.filename,
        Expires: 3600, // 1 hour
      };
      return s3.getSignedUrl('getObject', params);
    }

    return file.url;
  }
}

export const filesService = new FilesService();

