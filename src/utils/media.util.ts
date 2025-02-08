import {mediaConfig} from "../config/media.config";
import {UploadedFile} from "express-fileupload";

interface CloudinaryResult {
    secure_url: string;
}

export const cloudinaryUpload = async (images: UploadedFile[], productName: string): Promise<CloudinaryResult[]> => {
    const uploadPromises = images.map(image =>
        new Promise<CloudinaryResult>((resolve, reject) => {

            //  cloudinary upload
            mediaConfig.cloudinary.uploader.upload(
                image.tempFilePath,
                {
                    public_id: `${productName}-${Date.now()}`,
                    folder: "archsaint/products",
                    resource_type: "image",
                    use_filename: true,
                },
                (error, result) => {
                    if (error) {
                        console.error("Error uploading image", error);
                        reject(new Error(`Error uploading image, ${error.message}`));
                    } else {
                        resolve(result as CloudinaryResult);
                    }
                }
            )

        })
    )

    return Promise.all(uploadPromises)
}


