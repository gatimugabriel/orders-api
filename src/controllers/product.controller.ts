import {Request, Response} from "express";
import asyncHandler from "express-async-handler";
import {Prisma, PrismaClient} from "@prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";
import {cloudinaryUpload} from "../utils/media.util";
import {UploadedFile} from "express-fileupload";
import {SearchProductQuery} from "../@types/types";

const prisma = new PrismaClient().$extends(withAccelerate());
const Product = prisma.product

// @ desc --- Create new product
// @ route  --POST-- [base_api]/products
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        description,
        category,
        brand,
        weight,
        dimensions,
        price,
        discountRate,
        stock,
        slug,
        featured
    } = req.body

    // category field is expected as comma-separated string (because this endpoint gets FormData (for support of attaching files)
    let categories: string[]
    try {
        // Try to parse as JSON first (in case it's sent as JSON)
        categories = typeof category === 'string' ?
            (category.includes('[') ? JSON.parse(category) : category.split(',').map(c => c.trim())) :
            category
    } catch (error) {
        // If parsing fails, treat it as a single category
        categories = [category]
    }

    const priceFloat = parseFloat(price) || 0
    const stockInt = parseInt(stock) || 0
    const discountInt = parseInt(discountRate) || 0
    const weightInt = parseInt(weight) || 0
    const isFeatured = featured === 'true' || featured === true

    // Handle file uploads
    let imageUrls: string[] = []
    if (req.files) {
        // Handle both single and multiple file uploads
        // @ts-ignore
        const uploadedFiles = Object.values(req.files as UploadedFile | UploadedFile[])
        const imageArray: UploadedFile[] = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]

        // Upload storage
        if (imageArray.length > 0) {
            const uploadImagesResult = await cloudinaryUpload(imageArray, name)
            imageUrls = uploadImagesResult.map(image => image.secure_url)
        }
    }

    const data = await Product.create({
        data: {
            name,
            description: description || '',
            images: imageUrls,
            category: categories,
            brand: brand || '',
            weight: weightInt,
            dimensions: dimensions || '',
            price: priceFloat,
            discountRate: discountInt,
            stock: stockInt,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            featured: isFeatured
        }
    })

    res.status(201).json({
        success: true,
        message: "Product added successfully",
        data
    })

})

// @ desc --- Update Product
// @ route  --PUT-- [base_api]/products/:id
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params
    const existingProduct = await Product.findUnique({
        where: {id: Number(id)}
    })

    if (!existingProduct) {
        res.status(404).json({
            success: false,
            message: "Product not found"
        })
        return
    }

    const {
        name,
        description,
        category,
        brand,
        weight,
        dimensions,
        price,
        discountRate,
        slug,
        stock,
        featured
    } = req.body

    const updateData: any = {}

    if (category) {
        try {
            updateData.category = typeof category === 'string' ?
                (category.includes('[') ? JSON.parse(category) : category.split(',').map(c => c.trim())) :
                category
        } catch (error) {
            updateData.category = [category]
        }
    }

    // Handle numeric fields if provided
    if (price) updateData.price = parseFloat(price) || existingProduct.price
    if (stock) updateData.stock = parseInt(stock) || existingProduct.stock
    if (discountRate) updateData.discountRate = parseInt(discountRate) || existingProduct.discountRate
    if (weight) updateData.weight = parseInt(weight) || existingProduct.weight

    if (featured !== undefined) {
        updateData.featured = featured === 'true' || featured === true
    }

    if (name) updateData.name = name
    if (description) updateData.description = description
    if (brand) updateData.brand = brand
    if (dimensions) updateData.dimensions = dimensions
    if (slug) updateData.slug = slug

    // Handle image uploads if present
    if (req.files) {
        try {
            // @ts-ignore
            const uploadedFiles = Object.values(req.files as UploadedFile | UploadedFile[])
            const imageArray: UploadedFile[] = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]

            if (imageArray.length > 0) {
                const uploadImagesResult = await cloudinaryUpload(imageArray, name || existingProduct.name)
                updateData.images = uploadImagesResult.map(image => image.secure_url)
            }
        } catch (error) {
            res.status(400).json({
                success: false,
                message: "Failed to upload images",
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
            return
        }
    }

    const data = await Product.update({
        where: {id: Number(id)},
        data: updateData
    })

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data
    })
})

// @ desc --- Get Single Product
// @ route  --GET-- [base_api]/products/:id
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const data = await Product.findUnique({
        where: {id: Number(id)},
        cacheStrategy: {
            ttl: 3600, // 1 hour
            swr: 7200 // 2 hours
        }
    });

    if (!data) {
        res.status(404).json({
            message: "Product not found or may have been deleted"
        })
        return
    }

    res.status(200).json({data});
});

// @ desc --- Search for Product(s) with pagination and filtering
// @ route  --GET-- [base_api]/products/search/s
export const searchProduct = asyncHandler(async (req: Request, res: Response) => {
    const {
        searchTerm,
        category,
        minPrice,
        maxPrice,
        sortBy = 'newest',
        page = '1',
        limit = '12',
        brand
    } = req.query as SearchProductQuery

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    // Build where clause dynamically
    const whereClause: Prisma.ProductWhereInput = {
        AND: []
    }

    // Search term filter (search in name and description)
    if (searchTerm) {
        // @ts-ignore
        whereClause.AND.push({
            OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
        })
    }

    // *TODO : Fix category check (brings bug if included)
    // if (category) {
    //     // @ts-ignore
    //     whereClause.AND.push({
    //         category: { equals: category }
    //     })
    // }

    if (minPrice || maxPrice) {
       //@ts-ignore
        whereClause.AND.push({
            price: {
                gte: minPrice ? parseFloat(minPrice) : undefined,
                lte: maxPrice ? parseFloat(maxPrice) : undefined
            }
        })
    }

    if (brand) {
       //@ts-ignore
        whereClause.AND.push({
            brand: { equals: brand, mode: 'insensitive' }
        })
    }

    // Determine sort order
    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
        switch (sortBy) {
            case 'price_asc':
                return { price: 'asc' }
            case 'price_desc':
                return { price: 'desc' }
            case 'name_asc':
                return { name: 'asc' }
            case 'name_desc':
                return { name: 'desc' }
            case 'newest':
            default:
                return { createdAt: 'desc' }
        }
    })()

    // Execute
    const [data, total] = await Promise.all([
        Product.findMany({
            where: whereClause,
            skip,
            take: limitNum,
            orderBy
        }),
        Product.count({ where: whereClause })
    ])

    // Calculate aggregations
    const priceStats = await Product.aggregate({
        where: whereClause,
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true }
    })

    // unique brands filtering
    const uniqueBrands = await Product.findMany({
        where: whereClause,
        select: { brand: true },
        distinct: ['brand']
    })

    // pagination metadata
    const totalPages = Math.ceil(total / limitNum)
    const hasNext = pageNum < totalPages
    const hasPrev = pageNum > 1

    res.status(200).json({
        success: true,
        data,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext,
            hasPrev
        },
        stats: {
            priceRange: {
                min: priceStats._min.price,
                max: priceStats._max.price,
                avg: priceStats._avg.price
            },
            availableBrands: uniqueBrands.map(b => b.brand)
        }
    })
})

// @ desc --- Get Multiple Products
// @ route  --GET-- [base_api]/products
export const fetchProducts = asyncHandler(async (req: Request, res: Response) => {
    const {page, limit} = req.query

    const pageNumber = typeof page === "string" ? Number(page) - 1 : 0
    const intLimit = parseInt(limit as string) || 10 // items per page
    const skipValues = pageNumber * intLimit

    const totalCount = await Product.count()
    const products = await Product.findMany({
        skip: skipValues,
        take: intLimit,
        orderBy: [{id: 'asc'}],
        cacheStrategy: {
            ttl: 60 * 5, // 5 min
            swr: 60 * 10 // 10min
        }
    });

    res.status(200).json({
        page: pageNumber + 1,
        count: products.length,
        totalCount,
        data: products
    });
});

// @ desc --- Get Featured Products
// @ route  --GET-- [base_api]/products/featured
export const fetchFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
    const {page} = req.query
    const pageNumber = typeof page === "string" ? Number(page) - 1 : 0
    const limit = 6 // items per page
    const skipValues = pageNumber * limit

    const data = await prisma.product.findMany({
        where: {featured: true},
        skip: skipValues,
        take: limit,
        orderBy: [{id: 'asc'}],
        cacheStrategy: {
            ttl: 60 * 5, // 5 min
            swr: 60 * 10 // 10min
        }
    });

    res.status(200).json({
        page: pageNumber + 1,
        count: data.length,
        data
    });
});

// @ desc --- Delete Product
// @ route  --DELETE-- [base_api]/products/:id
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;

    const deleteProduct = await Product.delete({where: {id: Number(id)}});
    if (!deleteProduct) {
        res.status(400);
        throw new Error("Failed to delete product. Try again later");
    }

    res.status(200).json({message: "Product deleted successfully"});
})