import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

export interface Producto {
  id_producto?: number;
  nombre: string;
  descripcion: string;
  precio_normal: number;
  precio_oferta?: number | null;
  stock: number;
  id_categoria: number;
  marca: string;
  imagen_url?: string;
  categoria_nombre?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private apiUrl = 'http://localhost:3000/productos';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  getProductosByCategoria(categoria: string): Observable<Producto[]> {
    console.log(' Llamando a:', `${this.apiUrl}/categoria/${categoria}`);

    return this.http.get<any>(`${this.apiUrl}/categoria/${categoria}`).pipe(
      map((response) => {
        let productos = [];
        if (Array.isArray(response)) {
          productos = response;
        } else if (response && Array.isArray(response.productos)) {
          productos = response.productos;
        } else if (response && Array.isArray(response.data)) {
          productos = response.data;
        }
        return productos;
      }),
      catchError((error) => {
        console.error(' Error en getProductosByCategoria:', error);
        return of([]);
      })
    );
  }

  searchProductos(query: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar-nombre/${query}`).pipe(
      map((productos) =>
        productos.map((p) => {
          let url = p.imagen_url;

          // Si está vacía o no existe → no tocar
          if (!url) return p;

          // Quitar solo dobles barras // o / al inicio
          url = url.replace(/^\/+/, '');

          return {
            ...p,
            imagen_url: `http://localhost:3000/${url}`,
          };
        })
      )
    );
  }

  addProducto(producto: Producto): Observable<any> {
    return this.http.post<any>(this.apiUrl, producto);
  }

  updateProducto(id: number, producto: Producto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, producto);
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  updateStock(id: number, stock: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/stock`, { stock });
  }

  subirImagen(archivo: File): Observable<any> {
    console.log('📤 Servicio: Subiendo archivo:', archivo.name);
    const formData = new FormData();
    formData.append('imagen', archivo, archivo.name);
    return this.http.post('http://localhost:3000/upload/upload', formData).pipe(
      tap((response) => {
        console.log(' Servicio: Respuesta del servidor:', response);
      }),
      catchError((error) => {
        console.error(' Servicio: Error completo:', error);
        console.error(' Servicio: Error status:', error.status);
        console.error(' Servicio: Error message:', error.message);
        console.error(' Servicio: Error response:', error.error);
        return throwError(() => error);
      })
    );
  }
}
