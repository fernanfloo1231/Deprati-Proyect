import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EstadisticasAdminService {
  private baseUrl = 'http://localhost:3000/admin/estadisticas';

  constructor(private http: HttpClient) {}

  getVentas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/ventas`);
  }

  getTopProductos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/productos`);
  }
}
