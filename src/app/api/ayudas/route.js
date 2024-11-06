// ruta: src/app/api/ayudas/route.js
import dbConnect from "@/utils/dbConnect";
import Ayuda from "@/models/Ayuda";

const bannedWords = [
  // Español - contenido explícito y violencia
  "violación", "violador", "abusar", "abuso", "acoso", "acosar", "incesto", "sexo", "sexual", "pornografía", "porno",
  "prostitución", "prostituta", "violencia", "golpear", "golpe", "asesinar", "asesino", "homicidio", "matar", "morir", 
  "suicidio", "suicidarse", "cadáver", "tortura", "torturar", "genocidio", "homicida", "violento", "narcotráfico", 
  "narcotraficante", "secuestro", "secuestrar", "amenaza", "extorsión", "explotación", "pervertido", "perversión", 
  "pedófilo", "pedofilia", "pederasta", "pederastia", "rata", "zorra", "puta", "puto", "cabrona", "cabrón", "caca",
  "mierda", "maldito", "malparido", "coger", "pene", "vagina", "testículo", "escroto", "masturbar", "masturbación", 
  "correrse", "eyaculación", "teta", "tetona", "culo", "verga", "chingar", "chingón", "chingada", "chingar", "puñeta", 
  "maricón", "marica", "sodomía", "cachondo", "pedo", "pedorra", "pedorro", "pajero",
  "gilipollas", "infeliz", "zorrón", "culero", "fornicar",
  "malnacido", "pajear", "desnudo", "orgasmo",
  
  // Inglés - contenido explícito y violencia
  "rape", "rapist", "molest", "molestation", "harass", "harassment", "incest", "sex", "sexual", "pornography", "porn",
  "prostitution", "prostitute", "violence", "beat", "murder", "murderer", "homicide", "kill", "killer", "die", "suicide",
  "suicidal", "corpse", "torture", "genocide", "violent", "narco", "drug trafficking", "drug dealer", "kidnap", 
  "kidnapping", "extort", "extortion", "exploit", "exploitation", "pervert", "pedophile", "pedophilia", "necrophilia",
  "slut", "whore", "bitch", "bastard", "fuck", "fucker", "dick", "cock", "ass", "asshole", "boob", "tits", "masturbate",
  "masturbation", "cum", "orgasm", "ejaculation", "vagina", "penis", "scrotum", "testicles", "balls", "rectum",
  "suck", "blowjob", "hump", "dildo", "wanker", "jizz", "boner", "buttfuck", "fucker", "motherfucker", "douchebag",
  "asshat", "bitchass", "titties", "faggot", "sodomy", "humping", "gag", "kinky", "necrophile", "voyeur", "creampie",
  "choke", "gore", "cruelty", "rough", "bully", "bullying", "intimidate", "intimidation", "gory", "dead", "disgusting", "wtf",
  
  // Variantes y combinaciones comunes (censuradas, números, caracteres)
  "v!olaci0n", "v1olacion", "v10l4dor", "viol4cion", "s3xo", "p0rn", "p@rn", "pr0st1tut@", "v1olen", "golpe4", 
  "s3xual", "p3rv3rso", "n4rc0", "secuestr@", "abus@", "inc3sto", "m4ri", "p0rn0", "c0j3r", 
  "ch1ngad@", "paj4", "c@m", "n@ked", "s@d0", "t0rtura", "expl0t@r", "gen0", "kill3r", "h@rass", "d1ckh3ad", "tw@t",
  
  // Regionalismos y modismos ofensivos
  "pinga", "follar", "follador", "folladora",
  
  // Inglés - eufemismos y términos ofensivos o connotaciones sexuales
  "dong", "wang", "hooters", "muff", "wiener", "knob", "poonani", "splooge", "beefcurtains", "clap", "fluffer", 
  "gooch", "hardon", "jugs", "johnson", "mound", "package", "schlong", "woody", "poon", "schlong", "dong", "bone", 
  "ballsack", "cunnilingus", "fornicate", "clitoris", "genitalia", "backdoor", "junk", "sizzle", "kissing cousins", 
  "moist", "milf", "blowjob", "69", "bareback", "donkey punch", "rimjob", "furry", "barely legal", "yiff", "gimp", 
  "nipples", "teabagging", "queef", "brown shower", "golden shower", "grind", "raunchy", "daddy issues", "kama sutra",
  "x-rated", "threeway", "anal", "g-string", "jiggly", "boing", "threesome", "hardcore", "softcore", "penetration",
  
  // Eufemismos de violencia
  "offed", "axed", "knifed", "hitman", "killer", "manslaughter", "shiv", "stab", "stabbing", "choke", "suffocate",
  "smother", "strangle", "strangulation", "butcher", "massacre", "bloody", "bloodshed", "slaughter", "lynch", 
  "lynching", "execution", "executed", "behead", "decapitate", "tortured", "assassinate", "assassination", "extortion",
];

function containsBannedWords(text) {
  const lowerText = text.toLowerCase();

  const regexPattern = bannedWords
    .map((word) => {
      const chars = word.split("").map((char) => `(${char})`).join("[^a-zA-Z]{0,1}");
      return `\\b${chars}\\b`;
    })
    .join("|");

  const regex = new RegExp(regexPattern, "i");

  const match = lowerText.match(regex);
  
  if (match) {
    console.log(`Palabra ofensiva detectada: "${match[0]}"`); // Log de la palabra exacta detectada
    return true;
  }

  return false;
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    let ayudas;

    if (type === "recientes") {
      ayudas = await Ayuda.find()
        .sort({ timestamps: -1 })
        .skip(skip)
        .limit(limit);
    } else if (type === "populares") {
      const allAyudas = await Ayuda.find();
      ayudas = allAyudas
        .map((ayuda) => {
          const totalSolicitudes = ayuda.totalSolicitudes || 0;
          const totalAsistencias = ayuda.totalAsistencias || 0;
          const diferencia = totalSolicitudes - totalAsistencias;
          const esMasNecesitado = totalAsistencias === 0;
          return {
            ...ayuda._doc,
            totalSolicitudes,
            totalAsistencias,
            diferencia,
            esMasNecesitado,
          };
        })
        .sort((a, b) => {
          // Priorizar aquellos con totalAsistencias === 0
          if (a.esMasNecesitado && !b.esMasNecesitado) {
            return -1;
          } else if (!a.esMasNecesitado && b.esMasNecesitado) {
            return 1;
          } else if (a.esMasNecesitado && b.esMasNecesitado) {
            // Ambos tienen totalAsistencias === 0
            // Priorizar por mayor totalSolicitudes
            return b.totalSolicitudes - a.totalSolicitudes;
          } else {
            // Ambos tienen totalAsistencias > 0
            // Priorizar por mayor diferencia entre totalSolicitudes y totalAsistencias
            const diferenciaComparacion = b.diferencia - a.diferencia;
            if (diferenciaComparacion !== 0) {
              return diferenciaComparacion;
            } else {
              // Si la diferencia es igual, priorizar por mayor totalSolicitudes
              return b.totalSolicitudes - a.totalSolicitudes;
            }
          }
        })
        .slice(skip, skip + limit);
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

  // Verificar palabras prohibidas en título y descripción
  const { nombre, descripcion } = body;
  if (
    (nombre && containsBannedWords(nombre)) ||
    (descripcion && containsBannedWords(descripcion))
  ) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "El contenido contiene palabras prohibidas.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const nuevaAyuda = await Ayuda.create(body);
    console.log("Nueva ayuda creada:", nuevaAyuda);

    return new Response(JSON.stringify({ success: true, data: nuevaAyuda }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al crear ayuda:", error);

    // Verificación específica para errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error de validación: " + messages.join(", "),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Otros errores
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error al procesar la solicitud",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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