import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CarritoService } from '../../enlace/carrito.service';
import { ProductoService } from '../../enlace/producto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-detalle.html',
  styleUrls: ['./producto-detalle.css'],
})
export class ProductoDetalle implements OnInit {
  producto: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carritoService: CarritoService,
    private productoService: ProductoService
  ) {}

  ngOnInit() {
    //  Intentar recibir el producto desde navigation extras
    const nav = this.router.getCurrentNavigation();
    const productoState = nav?.extras?.state?.['producto'];

    if (productoState) {
      this.producto = productoState;
      return;
    }

    // Si no viene por state, cargarlo por ID desde la URL
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.router.navigate(['/home']);
      return;
    }

    this.productoService.getProductoById(id).subscribe({
      next: (data) => (this.producto = data),
      error: () => this.router.navigate(['/home']),
    });
  }
  cantidad: number = 1;

  aumentarCantidad() {
    if (this.cantidad < this.producto.stock) {
      this.cantidad++;
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Stock máximo',
        text: 'No puedes agregar más unidades, no hay más stock disponible',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  disminuirCantidad() {
    if (this.cantidad > 1) {
      this.cantidad--;
    }
  }

  agregarAlCarrito() {
    if (this.producto.stock <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Sin stock',
        text: 'Este producto está agotado actualmente.',
      });
      return;
    }

    const precioFinal =
      this.producto.precio_oferta > 0 ? this.producto.precio_oferta : this.producto.precio_normal;

    const productoCarrito = {
      id: this.producto.id_producto,
      nombre: this.producto.nombre,
      precio: precioFinal,
      imagen: this.producto.imagen_url,
      cantidad: this.cantidad,
      stock: this.producto.stock,
    };

    this.carritoService.agregarProducto(productoCarrito);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${this.cantidad} × ${this.producto.nombre} agregado al carrito`,
      showConfirmButton: false,
      timer: 1600,
    });
  }

  volver() {
    this.router.navigate(['/home']);
  }

  get imagen() {
    return this.getImagenUrl(this.producto?.imagen_url);
  }

  getImagenUrl(path: string | null): string {
    if (!path) return 'img/imagenplaceholder.jpg';

    const img = String(path).trim();

    // Si ya es URL completa
    if (img.startsWith('http')) {
      return img;
    }

    // Si viene como "/img/archivo.jpg"
    if (img.startsWith('/')) {
      return `http://localhost:3000${img}`;
    }

    // Si viene como "img/archivo.jpg"
    if (img.startsWith('img/')) {
      return `http://localhost:3000/${img}`;
    }

    // Si solo viene "archivo.jpg"
    return `http://localhost:3000/img/${img}`;
  }
}
