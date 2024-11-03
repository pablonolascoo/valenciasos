// import mongoose from "mongoose";

// const LocalidadSchema = new mongoose.Schema(
//   {
//     nombre: { type: String, required: true, maxlength: 30 },
//     descripcion: { type: String, maxlength: 500 },
//     totalSolicitudes: { type: Number, default: 0 },
//     totalAsistencias: { type: Number, default: 0 },
//     // location: {
//     //   type: { type: String, enum: ["Point"], default: "Point" },
//     //   coordinates: { type: [Number] },
//     // }
//   },
//   { collection: "localidades" }
// );

// // Define el índice de geolocalización en "location"
// // LocalidadSchema.index({ location: "2dsphere" });

// export default mongoose.models.Localidad || mongoose.model("Localidad", LocalidadSchema);

// ruta: src/models/Localidad.js
import mongoose from 'mongoose';

const LocalidadSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, maxlength: 30 },
    descripcion: { type: String, maxlength: 500 },
    totalSolicitudes: { type: Number, default: 0 },
    totalAsistencias: { type: Number, default: 0 },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number] },
    }
  },
  { collection: 'localidades' } // Fuerza el nombre de la colección
);

LocalidadSchema.index({ location: "2dsphere" });

export default mongoose.models.Localidad || mongoose.model('Localidad', LocalidadSchema);