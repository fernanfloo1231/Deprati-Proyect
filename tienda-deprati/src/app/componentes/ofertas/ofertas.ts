import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, ProductoService } from '../../enlace/producto';
import { ProductoCard } from '../producto-card/producto-card';
import { CarritoService } from '../../enlace/carrito.service';

@Component({
  selector: 'app-ofertas',
  standalone: true,
  imports: [CommonModule, ProductoCard],
  templateUrl: './ofertas.html',
  styleUrls: ['./ofertas.css'],
})
export class Ofertas implements OnInit {
  productos: Producto[] = [];
  productosEnOferta: Producto[] = [];
  cargando: boolean = true;
  error: string | null = null;

  constructor(private productoService: ProductoService, private carrito: CarritoService) {}

  ngOnInit(): void {
    this.cargarProductosEnOferta();

    //  Actualización suave sin recargar todas las ofertas
    document.addEventListener('stock-actualizado', (event: any) => {
      const { id_producto, nuevo_stock } = event.detail;

      const p = this.productosEnOferta.find((prod) => prod.id_producto === id_producto);
      if (p) {
        p.stock = nuevo_stock;
        console.log(` Stock actualizado en Ofertas → ID ${id_producto}: ${nuevo_stock}`);
      }
    });
  }

  cargarProductosEnOferta() {
    this.cargando = true;
    this.error = null;

    // Obtener productos de TODAS las categorías una por una
    this.productoService.getProductosByCategoria('Mujeres').subscribe({
      next: (productosMujeres: Producto[]) => {
        this.productoService.getProductosByCategoria('Hombres').subscribe({
          next: (productosHombres: Producto[]) => {
            this.productoService.getProductosByCategoria('Belleza').subscribe({
              next: (productosBelleza: Producto[]) => {
                this.productoService.getProductosByCategoria('Hogar').subscribe({
                  next: (productosHogar: Producto[]) => {
                    this.productoService.getProductosByCategoria('Tecnologia').subscribe({
                      next: (productosTecnologia: Producto[]) => {
                        // Combinar TODOS los productos
                        const todosProductos = [
                          ...productosMujeres,
                          ...productosHombres,
                          ...productosBelleza,
                          ...productosHogar,
                          ...productosTecnologia,
                        ];

                        console.log(' TODOS LOS PRODUCTOS:', todosProductos);
                        console.log(' Total de productos:', todosProductos.length);
                        this.productosEnOferta = todosProductos.filter(
                          (p) =>
                            p.precio_oferta &&
                            p.precio_oferta > 0 &&
                            p.precio_oferta < p.precio_normal
                        );

                        console.log(' PRODUCTOS EN OFERTA:', this.productosEnOferta);
                        console.log(' Número de ofertas:', this.productosEnOferta.length);

                        this.cargando = false;
                      },
                      error: (err) => {
                        console.error(' Error cargando Tecnologia:', err);
                        this.error = 'Error al cargar las ofertas';
                        this.cargando = false;
                      },
                    });
                  },
                  error: (err) => {
                    console.error(' Error cargando Hogar:', err);
                    this.error = 'Error al cargar las ofertas';
                    this.cargando = false;
                  },
                });
              },
              error: (err) => {
                console.error(' Error cargando Belleza:', err);
                this.error = 'Error al cargar las ofertas';
                this.cargando = false;
              },
            });
          },
          error: (err) => {
            console.error(' Error cargando Hombres:', err);
            this.error = 'Error al cargar las ofertas';
            this.cargando = false;
          },
        });
      },
      error: (err) => {
        console.error(' Error cargando Mujeres:', err);
        this.error = 'Error al cargar las ofertas';
        this.cargando = false;
      },
    });
  }

  precioConDescuento(p: Producto): number {
    if (!p.precio_oferta || p.precio_oferta <= 0) return p.precio_normal;
    return p.precio_oferta;
  }

  porcentajeDescuento(p: Producto): number {
    if (!p.precio_oferta || p.precio_oferta <= 0) return 0;
    return Math.round(((p.precio_normal - p.precio_oferta) / p.precio_normal) * 100);
  }

  tieneDescuento(p: Producto): boolean {
    return !!(p.precio_oferta && p.precio_oferta > 0 && p.precio_oferta < p.precio_normal);
  }

  // Método para obtener la URL completa de la imagen
  private getImagenUrlCompleta(imagenPath: string): string {
    if (!imagenPath) return 'img/imagenplaceholder.jpg';

    if (imagenPath.startsWith('http')) {
      return imagenPath;
    }

    if (imagenPath.startsWith('/')) {
      return `http://localhost:3000${imagenPath}`;
    }

    return `http://localhost:3000/img/${imagenPath}`;
  }
}
