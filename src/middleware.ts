// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserToken } from './api-tools/token';
import { HeaderKey } from './constants/string';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {

    const token = request.headers.get('Authorization') as string;
    if (!token) {

        return NextResponse.json({
            code: 100_0000 + 1,
            message: 'token无效',
        })
    }
    
    const get = await getUserToken(token)
    if (!get) {
        return NextResponse.json({
            code: 100_0000 + 1,
            message: 'token无效',
        })
    }

    const h = new Headers();
    h.set(HeaderKey.UID, get.userid);
    h.set(HeaderKey.USERNAME, get.username);
    return NextResponse.next({
        request: {
            headers: h,
        },
    })
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/api/text',
        '/api/bookmark',
        '/api/favicon',
    ],
}