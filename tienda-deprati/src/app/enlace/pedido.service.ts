import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Pedido {
  id_pedido: number;
  id_cliente: number;
  fecha_pedido: string;
  total: number;
  estado: string;
  metodo_pago: string;
  direccion_entrega: string;
  observaciones?: string;
  productos?: ProductoPedido[];
  rastreo?: RastreoPedido;
}

export interface ProductoPedido {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  imagen_url?: string;
}

export interface RastreoPedido {
  id_rastreo: number;
  id_pedido: number;
  ubicacion_actual: string;
  ciudad: string;
  latitud?: number | null;
  longitud?: number | null;
  estado_entrega: string;
  fecha_actualizacion: string;
  observaciones?: string;
}

export interface CrearPedidoRequest {
  metodo_pago: string;
  direccion_entrega: string;
  observaciones?: string;
  productos: Array<{
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private apiUrl = 'http://localhost:3000/pedidos';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('cliente_token') || localStorage.getItem('token');
    if (token) {
      return new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  /** Crear pedido desde carrito */
  crearPedido(pedidoData: CrearPedidoRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/crear`, pedidoData, {
      headers: this.getHeaders(),
    });
  }

  /** Obtener pedidos del cliente */
  obtenerPedidos(): Observable<{ success: boolean; pedidos: Pedido[] }> {
    console.log(' Obteniendo pedidos...');
    return this.http.get<{ success: boolean; pedidos: Pedido[] }>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  /** Obtener un pedido específico */
  obtenerPedido(id: number): Observable<{ success: boolean; pedido: Pedido }> {
    return this.http.get<{ success: boolean; pedido: Pedido }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /** Obtener rastreo de un pedido */
  obtenerRastreo(idPedido: number): Observable<{ success: boolean; rastreo: RastreoPedido }> {
    return this.http.get<{ success: boolean; rastreo: RastreoPedido }>(
      `${this.apiUrl}/rastreo/${idPedido}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /** Cancelar pedido */
  cancelarPedido(idPedido: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${idPedido}/cancelar`,
      {},
      {
        headers: this.getHeaders(),
      }
    );
  }
}
