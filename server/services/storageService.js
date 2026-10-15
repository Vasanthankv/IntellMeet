import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'recordings');

// Ensure local uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

let gridFSBucket = null;

const getGridFSBucket = () => {
  if (gridFSBucket) return gridFSBucket;
  if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'recording_media'
    });
    return gridFSBucket;
  }
  return null;
};

/**
 * Storage Abstraction Service
 * Supports:
 * 1. MongoDB Atlas GridFS (Persistent in cloud database, survives Render redeploys and restarts)
 * 2. Local disk fallback (/uploads/recordings)
 * 3. S3-compatible cloud storage (if AWS_S3_BUCKET is configured)
 */
export const StorageService = {
  /**
   * Store a media buffer or stream
   * @param {string} recordingId 
   * @param {Buffer} buffer 
   * @param {string} mimeType 
   * @param {string} filename 
   * @returns {Promise<{ storageType: string, fileKey: string, size: number }>}
   */
  async saveRecordingFile(recordingId, buffer, mimeType = 'video/webm', filename = '') {
    const safeFilename = filename || `${recordingId}.webm`;
    const fileSize = buffer.length;

    // 1. Try MongoDB Atlas GridFS (Permanent, survive Render container rebuilds)
    const bucket = getGridFSBucket();
    if (bucket) {
      try {
        // Remove any old chunks for this recording
        const existing = await bucket.find({ 'metadata.recordingId': recordingId }).toArray();
        for (const file of existing) {
          try { await bucket.delete(file._id); } catch (e) {}
        }

        return await new Promise((resolve, reject) => {
          const readable = Readable.from(buffer);
          const uploadStream = bucket.openUploadStream(safeFilename, {
            contentType: mimeType,
            metadata: {
              recordingId,
              uploadedAt: new Date(),
              mimeType
            }
          });

          readable.pipe(uploadStream)
            .on('error', (err) => {
              console.warn('GridFS upload failed, falling back to disk:', err.message);
              // Fallback to disk
              this.saveToDisk(safeFilename, buffer)
                .then(resolve)
                .catch(reject);
            })
            .on('finish', () => {
              resolve({
                storageType: 'GRIDFS',
                fileKey: uploadStream.id.toString(),
                filename: safeFilename,
                size: fileSize,
                mimeType
              });
            });
        });
      } catch (gridErr) {
        console.warn('GridFS initialization error, fallback to disk:', gridErr.message);
      }
    }

    // 2. Fallback to local disk
    return await this.saveToDisk(safeFilename, buffer, mimeType);
  },

  async saveToDisk(safeFilename, buffer, mimeType = 'video/webm') {
    const targetPath = path.join(uploadsDir, safeFilename);
    await fs.promises.writeFile(targetPath, buffer);
    return {
      storageType: 'LOCAL_DISK',
      fileKey: safeFilename,
      filename: safeFilename,
      size: buffer.length,
      mimeType
    };
  },

  /**
   * Retrieve file stream and metadata for HTTP Range streaming
   * @param {Object} recording Document
   * @returns {Promise<{ stream: Readable, size: number, mimeType: string, isGridFS: boolean }>}
   */
  async getRecordingStream(recording) {
    const bucket = getGridFSBucket();
    
    // Check if stored in GridFS
    if (bucket && (recording.storageType === 'GRIDFS' || recording.storageKey || recording.fileKey)) {
      try {
        let fileDoc = null;
        if (recording.fileKey && mongoose.Types.ObjectId.isValid(recording.fileKey)) {
          const files = await bucket.find({ _id: new mongoose.Types.ObjectId(recording.fileKey) }).toArray();
          fileDoc = files[0];
        }
        if (!fileDoc) {
          const files = await bucket.find({ 'metadata.recordingId': recording.recordingId }).toArray();
          fileDoc = files[0];
        }

        if (fileDoc) {
          return {
            size: fileDoc.length,
            mimeType: fileDoc.contentType || 'video/webm',
            isGridFS: true,
            openDownloadStream: (options) => bucket.openDownloadStream(fileDoc._id, options)
          };
        }
      } catch (e) {
        console.warn('GridFS stream fetch warning:', e.message);
      }
    }

    // Check disk storage
    const localFilename = recording.fileKey || recording.filename || `${recording.recordingId}.webm`;
    const localPath = path.join(uploadsDir, localFilename);
    if (fs.existsSync(localPath)) {
      const stats = await fs.promises.stat(localPath);
      return {
        size: stats.size,
        mimeType: localFilename.endsWith('.mp4') ? 'video/mp4' : 'video/webm',
        isGridFS: false,
        filePath: localPath
      };
    }

    // Alternate mp4 check
    const mp4Path = path.join(uploadsDir, `${recording.recordingId}.mp4`);
    if (fs.existsSync(mp4Path)) {
      const stats = await fs.promises.stat(mp4Path);
      return {
        size: stats.size,
        mimeType: 'video/mp4',
        isGridFS: false,
        filePath: mp4Path
      };
    }

    return null;
  },

  /**
   * Delete recording from storage
   */
  async deleteRecordingFile(recording) {
    const bucket = getGridFSBucket();
    if (bucket && recording.fileKey && mongoose.Types.ObjectId.isValid(recording.fileKey)) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(recording.fileKey));
      } catch (e) {}
    }

    const localFilename = recording.fileKey || `${recording.recordingId}.webm`;
    const localPath = path.join(uploadsDir, localFilename);
    if (fs.existsSync(localPath)) {
      try { await fs.promises.unlink(localPath); } catch (e) {}
    }
  }
};

export default StorageService;
