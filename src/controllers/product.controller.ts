import {Request, Response} from "express";
import asyncHandler from "express-async-handler";
import {Prisma, PrismaClient} from "@prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";
import {cloudinaryUpload} from "../utils/media.util";
import {UploadedFile} from "express-fileupload";
import {SearchProductQuery} from "../@types/types";
import {ProductCacheService} from "../services/cache/product-cache.service";

const prisma = new PrismaClient().$extends(withAccelerate());
const Product = prisma.product

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
        res.status(404)
        throw new Error("Product not found")
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

    const newData: any = {}

    if (category !== undefined) {
        try {
            newData.category = typeof category === 'string' ?
                (category.includes('[') ? JSON.parse(category) : category.split(',').map(c => c.trim())) :
                category
        } catch (error) {
            newData.category = [category]
        }
    }

    if (price !== undefined) newData.price = parseFloat(price)
    if (stock !== undefined) newData.stock = parseInt(stock)
    if (discountRate !== undefined) newData.discountRate = parseInt(discountRate)
    if (weight !== undefined) newData.weight = parseInt(weight)
    if (featured !== undefined) newData.featured = featured === 'true' || featured === true
    if (name !== undefined) newData.name = name
    if (description !== undefined) newData.description = description
    if (brand !== undefined) newData.brand = brand
    if (dimensions !== undefined) newData.dimensions = dimensions
    if (slug !== undefined) newData.slug = slug

    // Handle image uploads if present
    if (req.files) {
        try {
            // @ts-ignore
            const uploadedFiles = Object.values(req.files as UploadedFile | UploadedFile[])
            const imageArray: UploadedFile[] = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]

            if (imageArray.length > 0) {
                const uploadImagesResult = await cloudinaryUpload(imageArray, name || existingProduct.name)
                newData.images = uploadImagesResult.map(image => image.secure_url)
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
        data: newData
    })

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data
    })
})

// @ desc --- Get Single Product by ID
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const numericId = Number(id);

    // Try to get from cache first
    const cachedProduct = await ProductCacheService.getCachedProduct(numericId);
    if (cachedProduct) {
        res.json({
            success: true,
            data: cachedProduct,
            source: "cache"
        });
        return
    }

    // If not in cache, get from database
    const data = await Product.findUnique({
        where: {id: numericId},
        cacheStrategy: {
            ttl: 3600, // 1 hour
            swr: 7200 // 2 hours
        }
    });

    if (!data) {
        res.status(404).json({
            success: false,
            message: "Product not found"
        });
        return
    }

    // Cache the product for future requests
    await ProductCacheService.cacheProduct(numericId, data);

    res.status(200).json({
        success: true,
        data,
        source: "database"
    });
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
                {name: {contains: searchTerm, mode: 'insensitive'}},
                {description: {contains: searchTerm, mode: 'insensitive'}}
            ]
        })
    }

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
            brand: {equals: brand, mode: 'insensitive'}
        })
    }

    // Determine sort order
    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
        switch (sortBy) {
            case 'price_asc':
                return {price: 'asc'}
            case 'price_desc':
                return {price: 'desc'}
            case 'name_asc':
                return {name: 'asc'}
            case 'name_desc':
                return {name: 'desc'}
            case 'newest':
            default:
                return {createdAt: 'desc'}
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
        Product.count({where: whereClause})
    ])

    // Calculate aggregations
    const priceStats = await Product.aggregate({
        where: whereClause,
        _min: {price: true},
        _max: {price: true},
        _avg: {price: true}
    })

    // unique brands filtering
    const uniqueBrands = await Product.findMany({
        where: whereClause,
        select: {brand: true},
        distinct: ['brand']
    })

    // pagination metadata
    const totalPages = Math.ceil(total / limitNum)
    const hasNext = pageNum < totalPages
    const hasPrev = pageNum > 1

    // Cache the search results
    await ProductCacheService.cacheAllProducts(pageNum, data);

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

// @ desc --- Get many products with pagination
// @ route --GET-- [base_api]/products 
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit

    // Try to get from cache first
    const cachedProducts = await ProductCacheService.getCachedProducts(page);
    if (cachedProducts) {
        res.json({
            success: true,
            data: cachedProducts,
            source: "cache"
        });
        return
    }

    const products = await Product.findMany({
        skip,
        take: limit,
        orderBy: [{id: 'asc'}],
        cacheStrategy: {
            ttl: 60 * 5, // 5 min
            swr: 60 * 10 // 10min
        }
    });
    const total = await Product.count()


    res.json({
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        data: products,
        source: "database"
    })
});

// @ desc --- Get Featured Products
// @ route  --GET-- [base_api]/products/featured
export const fetchFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit

    const data = await prisma.product.findMany({
        where: {featured: true},
        skip,
        take: limit,
        orderBy: [{id: 'asc'}],
        cacheStrategy: {
            ttl: 60 * 5, // 5 min
            swr: 60 * 10 // 10min
        }
    });

    res.json({
        pagination: {
            page,
            limit,
            count: data.length,
        },
        data,
        source: "database"
    })
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