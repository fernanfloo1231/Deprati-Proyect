import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, ProductoService } from '../../enlace/producto';
import { ProductoCard } from '../producto-card/producto-card';
import { CarritoService } from '../../enlace/carrito.service';

@Component({
  selector: 'app-mujeres',
  standalone: true,
  imports: [CommonModule, ProductoCard],
  templateUrl: './mujeres.html',
  styleUrls: ['./mujeres.css'],
})
export class Mujeres implements OnInit {
  productos: Producto[] = [];
  cargando: boolean = true;
  error: string | null = null;

  constructor(private productoService: ProductoService, private carrito: CarritoService) {}

  ngOnInit(): void {
    this.cargarProductosMujeres();

    //  Actualizar stock sin volver a cargar todo
    document.addEventListener('stock-actualizado', (event: any) => {
      const { id_producto, nuevo_stock } = event.detail;

      const p = this.productos.find((prod) => prod.id_producto === id_producto);
      if (p) {
        p.stock = nuevo_stock;
        console.log(` Stock actualizado en Mujeres → ID ${id_producto}: ${nuevo_stock}`);
      }
    });
  }

  cargarProductosMujeres() {
    this.cargando = true;
    this.error = null;

    console.log(' Solicitando productos de categoría: Mujeres');

    this.productoService.getProductosByCategoria('Mujeres').subscribe({
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

        this.error = 'Error al cargar los productos para mujeres';
        this.cargando = false;
      },
    });
  }

  onAgregarAlCarrito(producto: Producto) {
    const precio = this.precioConDescuento(producto);
    this.carrito.agregarProducto({
      id: producto.id_producto,
      nombre: producto.nombre,
      precio: precio,
      imagen: producto.imagen_url,
      cantidad: 1,
    });
    alert(`${producto.nombre} añadido al carrito`);
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
