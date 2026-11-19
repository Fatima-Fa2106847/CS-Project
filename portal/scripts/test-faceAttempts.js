import "dotenv/config";
import prisma from "../lib/prisma.js";
import { isFaceLocked } from "../lib/security/faceAttempts.js";

async function test() {
    const user = await prisma.user.findFirst({
        where: {
            role: "STUDENT"
        }
    });

    if (!user) {
        console.log("No student found");
        return;
    }

    const locked = await isFaceLocked(user.id);

    console.log("Face locked:", locked);
}

test()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });