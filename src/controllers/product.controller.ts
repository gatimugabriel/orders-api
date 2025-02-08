import {Request, Response} from "express";
import asyncHandler from "express-async-handler";
import {PrismaClient} from "@prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";
import {cloudinaryUpload} from "../utils/media.util";
import {UploadedFile} from "express-fileupload";

const prisma = new PrismaClient().$extends(withAccelerate());
const Product = prisma.product

// @ desc --- Create new product
// @ route  --POST-- [base_api]/products
export const addProduct = asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        description,
        category,
        brand,
        quantity,
        dimensions,
        price,
        discountRate,
        stock,
        slug,
        featured
    } = req.body

    const categories = JSON.parse(category);
    const priceFloat = parseFloat(price);
    const stockInt = parseInt(stock);
    const discountInt = parseInt(discountRate);
    const isFeatured = featured === 'true';

    // @ts-ignore
    const UploadedFiles = Object.values(req.files as UploadedFile | UploadedFile[]);
    const imageArray: UploadedFile[] = Array.isArray(UploadedFiles) ? UploadedFiles : [UploadedFiles];

    //  upload images
    const uploadImagesResult = await cloudinaryUpload(imageArray, name)
    const imageUrls = uploadImagesResult.map(image => image.secure_url)

    const data = await Product.create({
        data: {
            name,
            description,
            images: imageUrls,
            category: categories,
            brand,
            quantity,
            dimensions,
            price: priceFloat,
            discountRate: discountInt,
            stock: stockInt,
            slug,
            featured: isFeatured
        }
    })

    res.status(201).json({
        message: "Product added successfully",
        data
    });
})

// @ desc --- Update Product
// @ route  --PUT-- [base_api]/products/:id
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const {
        name,
        description,
        category,
        brand,
        quantity,
        dimensions,
        price,
        discountRate,
        slug,
        stock,
        featured
    } = req.body

    const categories = JSON.parse(category);
    const priceFloat = parseFloat(price);
    const stockInt = parseInt(stock);
    const discountInt = parseInt(discountRate);
    const isFeatured = featured === 'true';

    const UploadedFiles = Object.values(req.files as unknown as UploadedFile | UploadedFile[]);
    const imageArray: UploadedFile[] = Array.isArray(UploadedFiles) ? UploadedFiles : [UploadedFiles];

    const uploadImagesResult = await cloudinaryUpload(imageArray, name)
    const imageUrls = uploadImagesResult.map(image => image.secure_url)

    const data = await Product.update({
        where: {id: Number(id)},
        data: {
            name,
            description,
            images: imageUrls,
            category: categories,
            brand,
            quantity,
            dimensions,
            price: priceFloat,
            discountRate: discountInt,
            stock: stockInt,
            slug,
            featured: isFeatured
        }
    });
    if (!data) {
        res.status(400);
        throw new Error("Product failed to update");
    }

    res.status(200).json({
        message: "Product updated successfully",
        data
    });
});

// @ desc --- Get Single Product
// @ route  --GET-- [base_api]/products/get/:id
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

    // console.log(product)
    res.status(200).json({data});
});

// @ desc --- Search for Product(s)
// @ route  --GET-- [base_api]/products/search/s
export const searchProduct = asyncHandler(async (req: Request, res: Response) => {
    const searchTerm = req.query.searchTerm as string
    const category = req.query.category as string
    const minPrice = req.query.minPrice as string
    const maxPrice = req.query.maxPrice as string

    // {category: {equals: category}}            ]

    const data = await Product.findMany({
        where: {
            OR: [
                {name: {contains: searchTerm, mode: 'insensitive'}},
            ]
        },
        // take: 25
    })

    res.status(200).json({data})
})

// @ desc --- Get Multiple Products
// @ route  --GET-- [base_api]/products/all
export const fetchProducts = asyncHandler(async (req: Request, res: Response) => {
    const {page} = req.query
    console.log(page)

    const pageNumber = typeof page === "string" ? Number(page) - 1 : 0
    const limit = 12 // items per page
    const skipValues = pageNumber * limit

    console.log(pageNumber)

    const totalCount = await Product.count()
    const products = await Product.findMany({
        skip: skipValues,
        take: limit,
        include: {
            OrderItem: true,
        },
        orderBy: [{id: 'asc'}],
        cacheStrategy: {
            ttl: 60 * 5, // 5 min
            swr: 60 * 10 // 10min
        }
    });

    console.log(pageNumber + 1, totalCount)

        res.status(200).json({
            totalCount,
            page: pageNumber + 1,
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
        include: {
            OrderItem: true,
        },
        orderBy: [{id: 'asc'}],
        cacheStrategy: {
            ttl: 60 * 5, // 5 min
            swr: 60 * 10 // 10min
        }
    });

    res.status(200).json({
        page: pageNumber + 1,
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