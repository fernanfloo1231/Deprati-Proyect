// hombres.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, ProductoService } from '../../enlace/producto';
import { CarritoService } from '../../enlace/carrito.service';
import { ProductoCard } from '../producto-card/producto-card';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-hombres',
  standalone: true,
  imports: [CommonModule, ProductoCard],
  templateUrl: './hombres.html',
  styleUrls: ['./hombres.css'],
})
export class Hombres implements OnInit {
  productos: Producto[] = [];
  cargando: boolean = true;
  error: string | null = null;

  constructor(private productoService: ProductoService, private carritoService: CarritoService) {}

  ngOnInit(): void {
    this.cargarProductosHombres();

    document.addEventListener('stock-actualizado', (event: any) => {
      const { id_producto, nuevo_stock } = event.detail;

      const p = this.productos.find((prod) => prod.id_producto === id_producto);
      if (p) {
        p.stock = nuevo_stock;
        console.log(` Stock actualizado en Hombres → ID ${id_producto}: ${nuevo_stock}`);
      }
    });
  }

  cargarProductosHombres() {
    this.cargando = true;
    this.error = null;

    console.log(' Solicitando productos de categoría: Hombres');

    this.productoService.getProductosByCategoria('Hombres').subscribe({
      next: (data: Producto[]) => {
        console.log(' PRODUCTOS RECIBIDOS HOMBRES:', data);
        this.productos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error(' Error cargando productos Hombres:', err);
        this.error = 'Error al cargar los productos para hombres';
        this.cargando = false;
      },
    });
  }

  precioConDescuento(p: Producto): number {
    if (!p.precio_oferta || p.precio_oferta <= 0) return p.precio_normal;
    return p.precio_oferta;
  }

  onAgregarAlCarrito(producto: Producto) {
    console.log(' Producto recibido en Hombres:', producto);

    this.carritoService.agregarProducto({
      id: producto.id_producto,
      nombre: producto.nombre,
      precio: this.precioConDescuento(producto),
      imagen: producto.imagen_url,
      cantidad: 1,
      stock: producto.stock,
    });

    Swal.fire({
      icon: 'success',
      title: 'Agregado al carrito',
      text: `${producto.nombre} fue agregado al carrito.`,
      timer: 1500,
      showConfirmButton: false,
    });
  }
}
