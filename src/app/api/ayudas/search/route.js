// ruta: src/app/api/ayudas/search/route.js
import dbConnect from '@/utils/dbConnect';
import Ayuda from '@/models/Ayuda';

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const nombre = searchParams.get('nombre');

  try {
    const duplicados = await Ayuda.find({
      nombre: { $regex: nombre, $options: 'i' }
    });
    return new Response(JSON.stringify({ success: true, data: duplicados }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }
}