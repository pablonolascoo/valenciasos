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
  "maricón", "marica", "gay", "lesbiana", "homosexual", "sodomía", "cachondo", "pedo", "pedorra", "pedorro", "pajero",
  "puñetas", "gilipollas", "infeliz", "zorrón", "carajo", "cagada", "cagón", "cagona", "culero", "fornicar", "bastardo",
  "malnacido", "perra", "pajear", "desnudo", "penetración", "penetrar", "orgasmo", "fetiche", "sadismo", "sadomasoquismo",
  
  // Inglés - contenido explícito y violencia
  "rape", "rapist", "molest", "molestation", "harass", "harassment", "incest", "sex", "sexual", "pornography", "porn",
  "prostitution", "prostitute", "violence", "beat", "murder", "murderer", "homicide", "kill", "killer", "die", "suicide",
  "suicidal", "corpse", "torture", "genocide", "violent", "narco", "drug trafficking", "drug dealer", "kidnap", 
  "kidnapping", "extort", "extortion", "exploit", "exploitation", "pervert", "pedophile", "pedophilia", "necrophilia",
  "slut", "whore", "bitch", "bastard", "fucker", "dick", "cock", "ass", "asshole", "boob", "tits", "masturbate",
  "masturbation", "cum", "orgasm", "ejaculation", "vagina", "penis", "scrotum", "testicles", "balls", "rectum",
  "suck", "blowjob", "hump", "dildo", "wanker", "jizz", "boner", "buttfuck", "fucker", "motherfucker", "douchebag",
  "asshat", "bitchass", "titties", "faggot", "sodomy", "humping", "gag", "kinky", "necrophile", "voyeur", "creampie",
  "choke", "gore", "cruelty", "rough", "bully", "bullying", "intimidate", "intimidation", "gory", "dead", "disgusting",
  
  // Variantes y combinaciones comunes (censuradas, números, caracteres)
  "v!olaci0n", "v1olacion", "v10l4dor", "viol4cion", "s3xo", "p0rn", "p@rn", "pr0st1tut@", "v1olen", "golpe4", 
  "s3xual", "p3rv3rso", "n4rc0", "secuestr@", "abus@", "inc3sto", "m4ri", "h0m0", "lezbi", "p0rn0", "c0j3r", 
  "ch1ngad@", "paj4", "c@m", "n@ked", "s@d0", "t0rtura", "expl0t@r", "gen0", "kill3r", "h@rass", "d1ckh3ad", "tw@t",
  
  // Regionalismos y modismos ofensivos
  "pinga", "chucha", "chingona", "pendejada", "hijueputa", "hijoputa", "cabronazo", "estupidez", "mamada", "guey",
  "guevada", "mamahuevo", "soplapollas", "gilipollas", "baboso", "zangano", "cabronada", "grosería", "pelotudo", 
  "pendejada", "cojudo", "mamadas", "puchica", "chucha", "carajo", "mamerto", "mijito", "cojones", "coño", "huevón",
  "güevon", "pelotudo", "boludo", "coger", "tira", "chamaco", "cachonda", "chiflado", "follar", "follador", "folladora",
  
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
          const porcentajeAsistencia =
            ayuda.totalSolicitudes === 0
              ? 0
              : ayuda.totalAsistencias / ayuda.totalSolicitudes;
          return { ...ayuda._doc, porcentajeAsistencia };
        })
        .sort((a, b) => a.porcentajeAsistencia - b.porcentajeAsistencia)
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

  function containsBannedWords(text) {
    const lowerText = text.toLowerCase();
  
    // Construye un patrón de regex que permita coincidencias amplias, ignorando caracteres no alfabéticos y números
    const regexPattern = bannedWords
      .map((word) => {
        // Divide cada palabra en caracteres, permitiendo cualquier número o símbolo entre ellos
        const chars = word.split("").map((char) => `(${char})`).join("[^a-zA-Z]*");
        return `\\b${chars}\\b`;
      })
      .join("|");
  
    const regex = new RegExp(regexPattern, "i"); // "i" para ignorar mayúsculas/minúsculas
  
    return regex.test(lowerText);
  }

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
      { status: 400 }
    );
  }

  try {
    const nuevaAyuda = await Ayuda.create(body);
    console.log(nuevaAyuda);

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