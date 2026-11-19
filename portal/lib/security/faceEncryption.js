import crypto from "node:crypto";

// Get the secret encryption key from .env
function getKey() {
    const key = process.env.FACE_ENCRYPTION_KEY;

    if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
        throw new Error("Invalid face encryption key");
    }

    return Buffer.from(key, "hex");
}

// Encrypt facial descriptor
export function encryptFace(descriptor) {
    const key = getKey();
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(descriptor), "utf8"),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return [
        iv.toString("hex"),
        tag.toString("hex"),
        encrypted.toString("hex")
    ].join(":");
}

// Decrypt facial descriptor
export function decryptFace(data) {
    const key = getKey();
    const [iv, tag, encrypted] = data.split(":");

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(tag, "hex"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, "hex")),
        decipher.final()
    ]);

    return JSON.parse(decrypted.toString("utf8"));
}