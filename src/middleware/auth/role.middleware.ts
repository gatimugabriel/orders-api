import {NextFunction, Response} from 'express'
import {ExtendedRequest} from '../../@types/express'
import asyncHandler from 'express-async-handler'

type RoleType = 'ADMIN' | 'MANAGER'

export const hasRoles = (allowedRoles: RoleType[]) => {
    return asyncHandler(async (
        req: ExtendedRequest,
        res: Response,
        next: NextFunction
    ) => {
        // user is set by authenticate middleware
        if (!req.user) {
            res.status(401)
            throw new Error('Login First!')
        }

        if (!allowedRoles.includes(req.user.role as RoleType)) {
            res.status(403)
            throw new Error('Insufficient permissions')
        }

        next()
    })
}

export const isAdmin = hasRoles(['ADMIN'])
export const isAdminOrManager = hasRoles(['ADMIN', 'MANAGER'])
