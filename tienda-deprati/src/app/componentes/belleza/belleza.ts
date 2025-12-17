import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Producto, ProductoService } from '../../enlace/producto';
import { ProductoCard } from '../producto-card/producto-card';
import { CarritoService } from '../../enlace/carrito.service';

@Component({
  selector: 'app-belleza',
  standalone: true,
  imports: [CommonModule, ProductoCard],
  templateUrl: './belleza.html',
  styleUrls: ['./belleza.css'],
})
export class Belleza implements OnInit {
  productos: Producto[] = [];
  cargando: boolean = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private carrito: CarritoService // ← Puedes eliminar esta línea si no la usas
  ) {}

  ngOnInit(): void {
    this.cargarProductosBelleza();
    document.addEventListener('stock-actualizado', () => {
      this.cargarProductosBelleza();
    });
  }

  cargarProductosBelleza() {
    this.cargando = true;
    this.error = null;

    console.log(' Solicitando productos de categoría: Belleza');

    this.productoService.getProductosByCategoria('Belleza').subscribe({
      next: (data: Producto[]) => {
        console.log(' PRODUCTOS RECIBIDOS:', data);
        console.log(' Número de productos:', data.length);

        // Verificar cada producto
        data.forEach((producto, index) => {
          console.log(` Producto ${index}:`, {
            id: producto.id_producto,
            nombre: producto.nombre,
            imagen_url: producto.imagen_url,
            categoria: producto.categoria_nombre,
            precio: producto.precio_normal,
          });

          // Verificar URL de imagen
          if (producto.imagen_url) {
            const urlCompleta = this.getImagenUrlCompleta(producto.imagen_url);
            console.log(` URL imagen ${index}:`, urlCompleta);
          }
        });

        this.productos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error(' Error cargando productos:', err);
        console.error('Status:', err.status);
        console.error('Mensaje:', err.message);
        console.error('Detalles:', err.error);

        this.error = 'Error al cargar los productos de belleza';
        this.cargando = false;
      },
    });
  }

  precioConDescuento(p: Producto): number {
    if (!p.precio_oferta || p.precio_oferta <= 0) return p.precio_normal;
    return p.precio_oferta;
  }

  private getImagenUrlCompleta(imagenPath: string): string {
    if (!imagenPath) return 'No tiene imagen';

    if (imagenPath.startsWith('http')) {
      return imagenPath;
    }

    if (imagenPath.startsWith('/')) {
      return `http://localhost:3000${imagenPath}`;
    }

    return `http://localhost:3000/img/${imagenPath}`;
  }
}
