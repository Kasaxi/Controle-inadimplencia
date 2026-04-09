// Rota desativada - Agora usamos upload direto via SDK no frontend
export async function POST() {
    return new Response('Upload via API desativado em favor do upload direto.', { status: 404 });
}
