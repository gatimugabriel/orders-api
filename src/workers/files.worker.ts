import Queue from "bull";
import fs from "fs";

const fileCleanupQueue = new Queue('file-cleanup-queue', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});

// Process file cleanup queue
fileCleanupQueue.process(async (job: any) => {
    const {tempFilePaths} = job.data;
    for (const filePath of tempFilePaths) {
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (error) {
            console.error(`Error deleting temp file ${filePath}:`, error);
        }
    }
}).then(r => {
    console.log('File cleanup queue processed successfully');
});

export const queueTempFileCleanup = async (tempFilePaths: string[]) => {
    await fileCleanupQueue.add({ tempFilePaths });
};