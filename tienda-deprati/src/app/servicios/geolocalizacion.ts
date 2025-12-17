// En servicios/geolocalizacion.ts - MEJORAR
import { Injectable } from '@angular/core';

export interface Coordenadas {
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root',
})
export class Geolocalizacion {
  private coordenadasCiudades: Record<string, Coordenadas> = {
    // Ecuador - Ciudades principales
    Quito: { lat: -0.1807, lng: -78.4678 },
    Guayaquil: { lat: -2.170998, lng: -79.922359 },
    Cuenca: { lat: -2.90055, lng: -79.00453 },
    Ambato: { lat: -1.241667, lng: -78.61972 },
    Machala: { lat: -3.258111, lng: -79.955124 },
    Manta: { lat: -0.95, lng: -80.7167 },
    Portoviejo: { lat: -1.0544, lng: -80.4544 },
    Loja: { lat: -3.99313, lng: -79.20422 },
    Ibarra: { lat: 0.339176, lng: -78.122234 },
    Riobamba: { lat: -1.66355, lng: -78.65464 },
    Esmeraldas: { lat: 0.968179, lng: -79.65172 },

    // Cantones y sectores de Quito
    'La Mariscal': { lat: -0.205, lng: -78.495 },
    'Centro Histórico': { lat: -0.22, lng: -78.5125 },
    Cumbayá: { lat: -0.2056, lng: -78.4289 },
    'Valle de los Chillos': { lat: -0.3167, lng: -78.5167 },
    Calderón: { lat: -0.1167, lng: -78.45 },

    // Cantones y sectores de Guayaquil
    Urdesa: { lat: -2.1667, lng: -79.9 },
    Centro: { lat: -2.1894, lng: -79.8891 },
    Samborondón: { lat: -1.9625, lng: -79.7244 },
    Daule: { lat: -1.8667, lng: -79.9833 },
    Durán: { lat: -2.1667, lng: -79.8333 },
  };

  obtenerCoordenadas(ciudad: string): Coordenadas | null {
    // Buscar coincidencia exacta primero
    if (this.coordenadasCiudades[ciudad]) {
      return this.coordenadasCiudades[ciudad];
    }

    // Buscar coincidencia parcial (case insensitive)
    const ciudadNormalizada = ciudad.toLowerCase().trim();
    for (const [key, value] of Object.entries(this.coordenadasCiudades)) {
      if (
        key.toLowerCase().includes(ciudadNormalizada) ||
        ciudadNormalizada.includes(key.toLowerCase())
      ) {
        console.log(` Coincidencia encontrada: "${ciudad}" -> "${key}"`);
        return value;
      }
    }

    console.warn(` No se encontraron coordenadas para: "${ciudad}"`);
    return null;
  }

  // NUEVO MÉTODO: Obtener coordenadas aproximadas por dirección
  obtenerCoordenadasPorDireccion(direccion: string): Coordenadas | null {
    const ciudades = Object.keys(this.coordenadasCiudades);

    for (const ciudad of ciudades) {
      if (direccion.toLowerCase().includes(ciudad.toLowerCase())) {
        console.log(` Ciudad detectada en dirección: ${ciudad}`);
        return this.coordenadasCiudades[ciudad];
      }
    }

    // Si no se encuentra ciudad específica, usar Quito por defecto
    console.warn(' Usando coordenadas por defecto (Quito)');
    return this.coordenadasCiudades['Quito'];
  }

  obtenerCiudadesDisponibles(): string[] {
    return Object.keys(this.coordenadasCiudades);
  }
}
