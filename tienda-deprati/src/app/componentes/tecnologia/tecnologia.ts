import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, ProductoService } from '../../enlace/producto';
import { ProductoCard } from '../producto-card/producto-card';
import { CarritoService } from '../../enlace/carrito.service';

@Component({
  selector: 'app-tecnologia',
  standalone: true,
  imports: [CommonModule, ProductoCard],
  templateUrl: './tecnologia.html',
  styleUrls: ['./tecnologia.css'],
})
export class Tecnologia implements OnInit {
  productos: Producto[] = [];
  cargando: boolean = true;
  error: string | null = null;

  constructor(private productoService: ProductoService, private carrito: CarritoService) {}

  ngOnInit(): void {
    this.cargarProductosTecnologia();

    //  Actualización suave del stock sin recargar la lista completa
    document.addEventListener('stock-actualizado', (event: any) => {
      const { id_producto, nuevo_stock } = event.detail;

      const p = this.productos.find((prod) => prod.id_producto === id_producto);
      if (p) {
        p.stock = nuevo_stock;
        console.log(` Stock actualizado en Tecnología → ID ${id_producto}: ${nuevo_stock}`);
      }
    });
  }

  cargarProductosTecnologia() {
    this.cargando = true;
    this.error = null;

    console.log(' Solicitando productos de categoría: Tecnologia');

    this.productoService.getProductosByCategoria('Tecnologia').subscribe({
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
        this.error = 'Error al cargar los productos de tecnología';
        this.cargando = false;
      },
    });
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
