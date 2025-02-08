import { Prisma } from "@prisma/client";

export const handlePrismaErrors = (error: any, context: string) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                error.meta = { ...error.meta, customMessage: `Duplicate entry in ${context}` };
                break;
            case 'P2003':
                error.meta = { ...error.meta, customMessage: `${error?.meta?.fieldName} not found` };
                break;
            case 'P2025':
                error.meta = { ...error.meta, customMessage: `${context} not found` };
                break;
            default:
                error.meta = { ...error.meta, customMessage: `Error in ${context}` };
        }
    }
    throw error;
}
