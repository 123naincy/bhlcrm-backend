import mongoose from "mongoose";

import DocumentModel, {
  DocumentEntity,
  DocumentType,
} from "../../models/inventory/Document";

class DocumentService {
  async getByEntity(
    entityType: DocumentEntity,
    entityId: string
  ) {
    return DocumentModel.find({
      entityType,
      entityId,
    }).sort({
      createdAt: -1,
    });
  }

  async upload(
    entityType: DocumentEntity,
    entityId: string,
    file: Express.Multer.File,
    documentType: DocumentType,
    userId: string,
    title?: string
  ) {
    const doc =
      await DocumentModel.create({
        entityType,

        entityId: new mongoose.Types.ObjectId(
          entityId
        ),

        documentType,

        title:
          title ||
          file.originalname,

        fileName: file.filename,

        fileUrl: `/uploads/${file.filename}`,

        fileSize: file.size,

        mimeType: file.mimetype,

        uploadedBy:
          new mongoose.Types.ObjectId(
            userId
          ),
      });

    return doc;
  }

  async delete(id: string) {
    return DocumentModel.findByIdAndDelete(
      id
    );
  }

  async getById(id: string) {
    return DocumentModel.findById(id);
  }
}

export default new DocumentService();
