// services/rastreo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Coordenadas, Geolocalizacion } from '../servicios/geolocalizacion';

export interface Pedido {
  id_pedido: number;
  id_cliente: number;
  fecha_pedido: string;
  total: number;
  estado: string;
  metodo_pago: string;
  direccion_entrega: string;
  observaciones?: string;
}

export interface Rastreo {
  id_rastreo: number;
  id_pedido: number;
  ubicacion_actual: string;
  ciudad: string;

  latitud: string;
  longitud: string;

  latitud_destino?: number;
  longitud_destino?: number;

  estado_entrega: string;
  fecha_actualizacion: string;
  observaciones?: string;

  direccion_entrega?: string;
  metodo_pago?: string;
  total?: number;
}

export interface RastreoResponse {
  success: boolean;
  rastreo: Rastreo;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RastreoService {
  private apiUrl = 'http://localhost:3000/rastreo';

  constructor(private http: HttpClient, private geolocalizacion: Geolocalizacion) {}

  calcularProgresoEntrega(estadoEntrega: string): number {
    const estados: { [key: string]: number } = {
      Procesando: 10,
      Empacado: 30,
      'En tránsito': 60,
      'En reparto': 85,
      Entregado: 100,
      Retrasado: 50,
      Cancelado: 0,
    };

    return estados[estadoEntrega] || 10;
  }

  obtenerDescripcionEstado(estado: string): string {
    const descripciones: { [key: string]: string } = {
      Procesando: 'Tu pedido está siendo procesado en nuestro centro de distribución',
      Empacado: 'Tu pedido ha sido empacado y está listo para envío',
      'En tránsito': 'Tu pedido está en camino a la ciudad de destino',
      'En reparto': 'Tu pedido está siendo entregado en tu zona',
      Entregado: '¡Tu pedido ha sido entregado satisfactoriamente!',
      Retrasado: 'Tu pedido está experimentando retrasos en la entrega',
      Cancelado: 'Tu pedido ha sido cancelado',
    };

    return descripciones[estado] || 'Estado desconocido';
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      Procesando: 'estado-procesando',
      Empacado: 'estado-empacado',
      'En tránsito': 'estado-transito',
      'En reparto': 'estado-reparto',
      Entregado: 'estado-entregado',
      Retrasado: 'estado-retrasado',
      Cancelado: 'estado-cancelado',
    };

    return clases[estado] || 'estado-desconocido';
  }

  obtenerColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      Procesando: '#ffc107',
      Empacado: '#17a2b8',
      'En tránsito': '#007bff',
      'En reparto': '#28a745',
      Entregado: '#20c997',
      Retrasado: '#dc3545',
      Cancelado: '#6c757d',
    };

    return colores[estado] || '#007bff';
  }

  obtenerRastreoPorPedido(idPedido: number): Observable<Rastreo> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RastreoResponse>(`${this.apiUrl}/${idPedido}`, { headers }).pipe(
      map((response) => {
        if (!response.success) throw new Error(response.error);
        return response.rastreo;
      }),
      catchError((err) => {
        console.error('Error al obtener rastreo:', err);
        throw err;
      })
    );
  }

  obtenerCoordenadasParaMapa(
    rastreo: Rastreo,
    direccionEntrega: string
  ): { origen: Coordenadas; destino: Coordenadas } {
    // ORIGEN desde backend
    const origen: Coordenadas = {
      lat: Number(rastreo.latitud),
      lng: Number(rastreo.longitud),
    };

    const destinoLat = Number(rastreo.latitud_destino);
    const destinoLng = Number(rastreo.longitud_destino);

    const destino: Coordenadas = {
      lat: isNaN(destinoLat) ? origen.lat : destinoLat,
      lng: isNaN(destinoLng) ? origen.lng : destinoLng,
    };

    return { origen, destino };
  }

  estaRetrasado(estadoEntrega: string): boolean {
    return estadoEntrega === 'Retrasado';
  }

  estaEntregado(estadoEntrega: string): boolean {
    return estadoEntrega === 'Entregado';
  }

  calcularProgresoPorEstado(estado: string): number {
    const mapa: any = {
      Pendiente: 10,
      Procesando: 10,
      Enviado: 60,
      'En tránsito': 60,
      'En reparto': 80,
      Retrasado: 40,
      Entregado: 100,
      Cancelado: 0,
    };

    return mapa[estado] ?? 10;
  }
}
