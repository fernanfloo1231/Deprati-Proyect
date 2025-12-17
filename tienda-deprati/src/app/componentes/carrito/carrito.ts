import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { CarritoService, ProductoCarrito } from '../../enlace/carrito.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './carrito.html',
  styleUrls: ['./carrito.css'],
})
export class CarritoComponent implements OnInit, OnDestroy {
  productos: ProductoCarrito[] = [];
  loading: boolean = false;
  private sub?: Subscription;
  private loadingSub?: Subscription;

  constructor(public router: Router, public carritoService: CarritoService) {}

  ngOnInit() {
    console.log(
      ' CarritoComponent iniciado - Usuario autenticado:',
      this.carritoService.estaAutenticadoPublico()
    );
    if (!this.carritoService.estaAutenticadoPublico()) {
      console.log(' No hay usuario autenticado, cargando carrito local...');
      this.carritoService.recargarCarrito();
    } else {
      console.log(' Usuario autenticado, carrito se maneja con backend...');
    }
    this.sub = this.carritoService.productos$.subscribe((lista) => {
      console.log(' Productos en carrito:', lista.length);
      this.productos = lista;
    });
    this.loadingSub = this.carritoService.loading$.subscribe((loading) => {
      this.loading = loading;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.loadingSub?.unsubscribe();
  }

  getTotal(): number {
    const total = this.productos.reduce((acc, prod) => acc + this.getSubtotal(prod), 0);
    return isNaN(total) ? 0 : total;
  }

  getSubtotal(producto: ProductoCarrito): number {
    const precio = this.asegurarNumero(producto.precio);
    const cantidad = this.asegurarNumero(producto.cantidad);
    const subtotal = precio * cantidad;
    return isNaN(subtotal) ? 0 : subtotal;
  }

  getPrecioUnitario(producto: ProductoCarrito): number {
    return this.asegurarNumero(producto.precio);
  }

  /** Método auxiliar para asegurar números */
  private asegurarNumero(valor: any): number {
    if (valor === null || valor === undefined || valor === '') {
      return 1;
    }

    const numero = Number(valor);

    if (isNaN(numero) || numero <= 0) {
      return 1;
    }

    return numero;
  }

  actualizarCantidad(index: number, cantidad: string) {
    let qty = Number(cantidad);
    if (isNaN(qty) || qty < 1) {
      qty = 1;
    }

    const producto = this.productos[index];

    if (producto.stock > 0 && qty > producto.stock) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${producto.stock} unidades disponibles`,
      });
      return;
    }

    this.carritoService.actualizarCantidadPorIndex(index, qty);
  }

  solicitarEliminarProducto(index: number) {
    const producto = this.productos[index];

    Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás "${producto.nombre}" del carrito.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.carritoService.eliminarProductoPorIndex(index);

        Swal.fire({
          title: 'Eliminado!',
          text: `"${producto.nombre}" ha sido eliminado del carrito.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }

  vaciarCarrito() {
    if (this.productos.length === 0) {
      Swal.fire('Carrito vacío', 'No hay productos para vaciar.', 'info');
      return;
    }

    Swal.fire({
      title: '¿Vaciar carrito?',
      text: 'Se eliminarán todos los productos del carrito.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.carritoService.vaciarCarrito().subscribe({
          next: () => {
            Swal.fire({
              title: 'Carrito vaciado!',
              text: 'Todos los productos han sido eliminados.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (error) => {
            Swal.fire('Error', 'No se pudo vaciar el carrito.', 'error');
          },
        });
      }
    });
  }

  comprar() {
    if (this.productos.length === 0) {
      Swal.fire('Carrito vacío', 'Agrega productos al carrito antes de comprar.', 'warning');
      return;
    }

    // Verificar stock
    const sinStock = this.productos.filter((p) => p.stock > 0 && p.cantidad > p.stock);
    if (sinStock.length > 0) {
      const productosSinStock = sinStock.map((p) => p.nombre).join(', ');
      Swal.fire({
        icon: 'error',
        title: 'Stock insuficiente',
        html: `Los siguientes productos no tienen suficiente stock:<br><strong>${productosSinStock}</strong>`,
      });
      return;
    }

    this.router.navigate(['/checkout']);
  }

  seguirComprando() {
    this.router.navigate(['/']);
  }

  // Manejar error de imagen
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'img/imagenplaceholder.jpg';
    img.onerror = null;
  }
}
