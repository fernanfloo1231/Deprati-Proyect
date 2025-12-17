import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoAdminService {

  private api = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) {}

  // Obtener todos los pedidos del sistema (solo admin)
  getPedidos(): Observable<any> {
    return this.http.get(`${this.api}/pedidos`);
  }

  // Actualizar estado de un pedido
  actualizarEstado(id_pedido: number, estado: string): Observable<any> {
    return this.http.put(`${this.api}/pedidos/${id_pedido}/estado`, { estado });
  }
}
