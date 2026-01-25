
/**
 * Verify authentication from API route request
 * Returns userId if valid, null otherwise
 */
export async function verifyAuth(request: any): Promise<string | null> {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const { auth: adminAuth } = await import('@/lib/firebase-admin');

        if (!adminAuth) {
            console.error('Firebase Auth not initialized');
            return null;
        }

        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error('Auth verification error:', error);
        return null;
    }
}
