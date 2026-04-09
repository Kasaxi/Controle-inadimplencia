import { NextResponse } from 'next/server';
import { ID, InputFile } from 'node-appwrite/file';
import { appwriteServer, BUCKET_ID } from '@/lib/appwriteServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Nota: O limite físico da Vercel para funções serverless é 4.5MB.
// Em roteamento App Router, o limite é gerenciado pela plataforma.

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        // Convert File to Buffer for node-appwrite compatibility if needed
        const buffer = Buffer.from(await file.arrayBuffer());
        const inputFile = InputFile.fromBuffer(buffer, file.name);

        const response = await appwriteServer.storage.createFile(
            BUCKET_ID,
            ID.unique(),
            inputFile
        );

        // Ge the file view URL
        const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`;

        return NextResponse.json({ 
            fileId: response.$id,
            fileUrl: fileUrl
        });
    } catch (error) {
        console.error('Upload Proxy Error:', error);
        const err = error as Error;
        return NextResponse.json({ error: err.message || 'Falha no upload do arquivo' }, { status: 500 });
    }
}
