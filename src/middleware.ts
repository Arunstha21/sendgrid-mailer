import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
const jwtSecretKey = new TextEncoder().encode(process.env.JWT_SECRET);

const checkToken = async (req: NextRequest) => {
    try {
        const token = req.cookies.get('token')?.value || '';
        const { payload } = await jwtVerify(token, jwtSecretKey);
        return { valid: true, payload };
    } catch (error: any) {
        return { valid: false, expired: error.code === 'ERR_JWT_EXPIRED' };
    }
};

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const isPublicPath = path === '/';
    const tokenCheck = await checkToken(request);

    if (typeof tokenCheck === 'object' && !tokenCheck.valid && tokenCheck.expired) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('token');
        return response;
    }

    const token = tokenCheck.valid;
    const userRole = tokenCheck.payload?.superUser;

    if(path === '/dashboard' && token){
        return NextResponse.redirect(new URL('/dashboard/new', request.url));
    }
    
    if (path === '/adduser' && !userRole) {
        return NextResponse.redirect(new URL('/dashboard/new', request.url));
    }

    if (isPublicPath && token) {
        return NextResponse.redirect(new URL('/dashboard/new', request.url));
    }

    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/adduser',
        '/dashboard/:path*',
        '/'
    ]
};
