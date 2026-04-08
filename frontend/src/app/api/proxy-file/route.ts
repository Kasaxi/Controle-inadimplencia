import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
        return new NextResponse('URL parameter missing', { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT || '',
                'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
            }
        });

        if (!response.ok) {
            console.error('Appwrite fetch failed:', response.status, response.statusText);
            return new NextResponse(`Failed to fetch file: ${response.statusText}`, { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': 'inline',
            }
        });
    } catch (e) {
        console.error('Proxy Error:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
