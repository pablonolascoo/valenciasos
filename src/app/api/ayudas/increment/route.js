// ruta: src/app/api/ayudas/increment/route.js
import dbConnect from "@/utils/dbConnect";
import Ayuda from "@/models/Ayuda";

export async function PATCH(req) {
  await dbConnect();
  const { id } = await req.json();

  try {
    const ayudaActualizada = await Ayuda.findByIdAndUpdate(
      id,
      { $inc: { totalSolicitudes: 1 } },
      { new: true }
    );
    return new Response(
      JSON.stringify({ success: true, data: ayudaActualizada }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}