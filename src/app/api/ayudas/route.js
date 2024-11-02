// ruta: src/app/api/ayudas/route.js
import dbConnect from "@/utils/dbConnect";
import Ayuda from "@/models/Ayuda";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    let ayudas;

    if (type === "recientes") {
      ayudas = await Ayuda.find().sort({ timestamps: -1 }).limit(10);
    } else if (type === "populares") {
      const allAyudas = await Ayuda.find();
      ayudas = allAyudas
        .map((ayuda) => {
          const porcentajeAsistencia =
            ayuda.totalSolicitudes === 0
              ? 0
              : ayuda.totalAsistencias / ayuda.totalSolicitudes;
          return { ...ayuda._doc, porcentajeAsistencia };
        })
        .sort((a, b) => a.porcentajeAsistencia - b.porcentajeAsistencia)
        .slice(0, 10);
    }
    return new Response(JSON.stringify({ success: true, data: ayudas }), {
      status: 200,
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json();

  try {
    const nuevaAyuda = await Ayuda.create(body);
    console.log(nuevaAyuda)
    
    return new Response(JSON.stringify({ success: true, data: nuevaAyuda }), {
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }
}

export async function PUT(req) {
  await dbConnect();
  const { id, incrementSolicitudes } = await req.json();

  try {
    let ayudaActualizada;
    
    if (incrementSolicitudes) {
      ayudaActualizada = await Ayuda.findByIdAndUpdate(
        id,
        { $inc: { totalSolicitudes: 1 } },
        { new: true }
      );
    } else {
      ayudaActualizada = await Ayuda.findByIdAndUpdate(
        id,
        { $inc: { totalAsistencias: 1 } },
        { new: true }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: ayudaActualizada }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
    });
  }
};

// Nueva función para incrementar totalSolicitudes
export async function PATCH(req) {
  await dbConnect();
  const { id } = await req.json();
  console.log("ID recibido para incrementar solicitud:", id); // Log para verificar el ID

  try {
    const ayudaActualizada = await Ayuda.findByIdAndUpdate(
      id,
      { $inc: { totalSolicitudes: 1 } },
      { new: true }
    );
    console.log("Resultado de la actualización:", ayudaActualizada); // Log para verificar el resultado de la actualización
    return new Response(
      JSON.stringify({ success: true, data: ayudaActualizada }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al incrementar la solicitud:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}