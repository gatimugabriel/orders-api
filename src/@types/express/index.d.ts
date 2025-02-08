// import { User } from "@prisma/client";
import {Request} from "express";

// declare global {
//   namespace Express {
//     interface Request {
//       user?: User;
//     }
//   }
// }

interface ExtendedRequest extends Request {
  user?: {
    userID: number | string; [key: string]: any,
    role: string,
  };
}
