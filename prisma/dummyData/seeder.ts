import { PrismaClient } from '@prisma/client';
import { productsSeedData } from './models/products';
import {userSeedData} from "./models/users";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('\n\n Seeding started...\n\n');

        console.log('Seeding products...');
        for (const item of productsSeedData) {
            await prisma.product.create({
                data: item,
            });
        }
        console.log('Products seeded successfully.\n\n');

        console.log('Seeding users...');
        // for (const user of userSeedData) {
        //     await prisma.user.create({
        //         data: user,
        //     });
        // }
        console.log('Users seeded successfully.\n\n');


        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
