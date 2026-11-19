import "dotenv/config";
import prisma from "../lib/prisma.js";
import { encryptFace, decryptFace } from "../lib/security/faceEncryption.js";

async function migrateFaces() {
    const users = await prisma.user.findMany({
        where: {
            faceTemplateRef: { not: null }
        }
    });

    let count = 0;

    for (const user of users) {
        const data = user.faceTemplateRef;

        // Skip already encrypted descriptors
        if (!data.trim().startsWith("[")) {
            decryptFace(data);
            continue;
        }

        // Convert existing facial data into an array
        const descriptor = JSON.parse(data);

        // Validate the descriptor
        if (
            !Array.isArray(descriptor) ||
            descriptor.length !== 128 ||
            !descriptor.every(
                value => Number.isFinite(value) && Math.abs(value) <= 2
            )
        ) {
            throw new Error("Invalid stored descriptor");
        }

        const encrypted = encryptFace(descriptor);

        // Update the existing user
        await prisma.user.updateMany({
            where: {
                id: user.id,
                faceTemplateRef: data
            },
            data: {
                faceTemplateRef: encrypted
            }
        }).then(result => {
            count += result.count;
        });
    }

    console.log("Facial templates encrypted:", count);
}

migrateFaces()
    .catch(error => {
        console.error("Migration failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });