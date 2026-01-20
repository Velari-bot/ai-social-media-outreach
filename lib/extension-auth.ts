import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'verality-extension-secret-key-12345';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function signExtensionToken(payload: { userId: string; email: string }) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Extension tokens can last longer for better UX
        .sign(secret);
    return token;
}

export async function verifyExtensionToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as { userId: string; email: string };
    } catch (err) {
        return null;
    }
}
