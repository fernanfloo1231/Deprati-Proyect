import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, ProductoService } from '../../enlace/producto';
import { ProductoCard } from '../producto-card/producto-card';
import { CarritoService } from '../../enlace/carrito.service';

@Component({
  selector: 'app-hogar',
  standalone: true,
  imports: [CommonModule, ProductoCard],
  templateUrl: './hogar.html',
  styleUrls: ['./hogar.css'],
})
export class Hogar implements OnInit {
  productos: Producto[] = [];
  cargando: boolean = true;
  error: string | null = null;

  constructor(private productoService: ProductoService, private carrito: CarritoService) {}

  ngOnInit(): void {
    this.cargarProductosHogar();

    document.addEventListener('stock-actualizado', (event: any) => {
      const { id_producto, nuevo_stock } = event.detail;

      const p = this.productos.find((prod) => prod.id_producto === id_producto);
      if (p) {
        p.stock = nuevo_stock;
        console.log(`🏠 Stock actualizado en Hogar → ID ${id_producto}: ${nuevo_stock}`);
      }
    });
  }

  cargarProductosHogar() {
    this.cargando = true;
    this.error = null;

    console.log('🚀 Solicitando productos de categoría: Hogar');

    this.productoService.getProductosByCategoria('Hogar').subscribe({
      next: (data: Producto[]) => {
        console.log('✅ PRODUCTOS RECIBIDOS HOGAR:', data);

        this.productos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando productos Hogar:', err);
        this.error = 'Error al cargar los productos para el hogar';
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
}
