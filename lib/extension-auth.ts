import { SignJWT, jwtVerify } from 'jose';

// Get secret and be extremely aggressive about cleaning it
const RAW_SECRET = process.env.JWT_SECRET || 'verality-extension-fallback-secret-2024';
const JWT_SECRET = RAW_SECRET.trim();
const secret = new TextEncoder().encode(JWT_SECRET);

export async function signExtensionToken(payload: { userId: string; email: string }) {
    console.log(`[Extension-Auth] Signing for ${payload.email} using secret starting with: ${JWT_SECRET.substring(0, 4)}...`);

    // Explicitly set issuer and audience to help prevent cross-domain token reuse
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('verality-auth-server')
        .setExpirationTime('30d')
        .sign(secret);
    return token;
}

export async function verifyExtensionToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret, {
            issuer: 'verality-auth-server',
        });
        return payload as { userId: string; email: string };
    } catch (err: any) {
        console.error(`[Extension-Auth] Verification FAILED (${err.code || err.message}). Secret used starts with: ${JWT_SECRET.substring(0, 4)}...`);
        return null;
    }
}
