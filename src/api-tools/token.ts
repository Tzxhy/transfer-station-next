
import { UserPayload } from '@/global';
import * as jose from 'jose'

const secret = new TextEncoder().encode(process.env.JWTTOKEN as string);

export async function genUserToken(name: string, userId: string): Promise<string> {
    const jws = await new jose.CompactSign(
        new TextEncoder().encode(JSON.stringify({
            username: name,
            userid: userId,
        })),
    )
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret)
    return jws;
}

export async function getUserToken(token: string): Promise<UserPayload | null> {
    try {
        const { payload, protectedHeader } = await jose.jwtVerify(token, secret);
        return payload as UserPayload;
    } catch (e) {
        console.log('e: ', e);
        return null;
    }
}