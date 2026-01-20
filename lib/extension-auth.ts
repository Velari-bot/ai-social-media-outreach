import { SignJWT, jwtVerify } from 'jose';

// Use a MORE robust fallback secret and ensure it's trimmed
const JWT_SECRET = (process.env.JWT_SECRET || 'verality-extension-secret-key-1-2-3-4-5').trim();
const secret = new TextEncoder().encode(JWT_SECRET);

export async function signExtensionToken(payload: { userId: string; email: string }) {
    console.log('Signing token for:', payload.userId);
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(secret);
    return token;
}

export async function verifyExtensionToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as { userId: string; email: string };
    } catch (err: any) {
        console.error('JWT Verification Error:', err.message);
        return null;
    }
}
