import mongoose from 'mongoose';

const AyudaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, maxlength: 30 },
  descripcion: { type: String, maxlength: 100 },
  totalSolicitudes: { type: Number, default: 0 },
  totalAsistencias: { type: Number, default: 0 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  localidad: { type: String, required: true },
  timestamps: { type: Date, default: Date.now }
});

// Define el índice de geolocalización en "location"
AyudaSchema.index({ location: '2dsphere' });

export default mongoose.models.Ayuda || mongoose.model('Ayuda', AyudaSchema);