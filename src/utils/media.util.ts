import { mediaConfig } from "../config/media.config";
import { UploadedFile } from "express-fileupload";
import { queueTempFileCleanup } from "../workers/files.worker";

interface CloudinaryResult {
    secure_url: string;
}

/*  Uploads single/multiple image files to cloudinary, then invokes background worker to delete tempfile from server
*   @param: images array
*   @param: product name
* 
*   NOT implemented -> retries in case of failure such as network problems
*/
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

                        // Queue cleanup of temp files
                        queueTempFileCleanup([image.tempFilePath]);
                    } else {
                        resolve(result as CloudinaryResult);

                        // Queue cleanup of temp files
                        queueTempFileCleanup([image.tempFilePath]);
                    }
                }
            )

        })
    )

    return Promise.all(uploadPromises)
}


