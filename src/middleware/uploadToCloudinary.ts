import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Upload a single file (image or pdf) to Cloudinary.
 * Automatically sets resource_type based on mimetype.
 */
// cloudinary.ts
export const uploadToCloudinarySingle = async (
  file: Express.Multer.File,
  folder: string
): Promise<{ url: string; public_id: string }> => {
  try {
    const resourceType = file.mimetype === "application/pdf" ? "raw" : "image";

    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: resourceType,
    });
    console.log("Cloudinary result:", result);

    fs.unlinkSync(file.path);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (err) {
    throw new Error("Cloudinary single file upload failed");
  }
};

/**
 * Upload multiple files to Cloudinary (images or PDFs).
 * Used for product images, documents, etc.
 */
export const uploadToCloudinaryMany = async (
  files: Express.Multer.File[],
  folder: string
): Promise<string[]> => {
  const urls: string[] = [];

  for (const file of files) {
    const resourceType = file.mimetype === "application/pdf" ? "raw" : "image";

    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: resourceType,
    });

    urls.push(result.secure_url);
    fs.unlinkSync(file.path);
  }

  return urls;
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    throw new Error("Cloudinary image deletion failed");
  }
};
