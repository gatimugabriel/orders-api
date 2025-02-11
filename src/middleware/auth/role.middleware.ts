import { Response, NextFunction } from 'express'
import { ExtendedRequest } from '../../@types/express'
import asyncHandler from 'express-async-handler'

type RoleType = 'ADMIN' | 'MANAGER' | 'EDITOR'

export const hasRoles = (allowedRoles: RoleType[]) => {
    return asyncHandler(async (
        req: ExtendedRequest,
        res: Response,
        next: NextFunction
    ) => {
        // user is set by authenticate middleware
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            })
            return
        }

        if (!allowedRoles.includes(req.user.role as RoleType)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            })
            return
        }

        next()
    })
}

export const isAdmin = hasRoles(['ADMIN'])
export const isAdminOrManager = hasRoles(['ADMIN', 'MANAGER'])
export const isContentManager = hasRoles(['ADMIN', 'MANAGER', 'EDITOR'])