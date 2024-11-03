// ruta: src/app/api/localidades/search/route.js
import dbConnect from '@/utils/dbConnect';
import Localidad from '@/models/Localidad';

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const localidad = searchParams.get('localidad');
  console.log("Valor de búsqueda de localidad:", localidad);

  try {
    // Realiza una búsqueda con regex
    const coincidencias = await Localidad.find({
      nombre: { $regex: localidad, $options: 'i' }
    });

    return new Response(JSON.stringify({ success: true, data: coincidencias }), { status: 200 });
  } catch (error) {
    console.error("Error al buscar localidades:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400 });
  }
}