import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from '../../enlace/producto';
import { CarritoService } from '../../enlace/carrito.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscar.html',
  styleUrls: ['./buscar.css'],
})
export class Buscar {
  Math = Math;
  public query: string = '';
  public resultados: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    private carrito: CarritoService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.query = params['query'] || '';
      this.buscar();
    });

    document.addEventListener('stock-actualizado', (event: any) => {
      const { id_producto, nuevo_stock } = event.detail;

      const p = this.resultados.find((prod) => prod.id_producto === id_producto);
      if (p) {
        p.stock = nuevo_stock;
        console.log(`🔎 Buscar: stock actualizado → ID ${id_producto}: ${nuevo_stock}`);
      }
    });
  }

  verDetalle(producto: any) {
    this.router.navigate(['/producto', producto.id_producto]);
  }

  // BUSCAR PRODUCTOS

  public buscar() {
    this.productoService.searchProductos(this.query).subscribe({
      next: (data) => {
        // Inicializa "cantidad" para cada producto
        this.resultados = data.map((p: any) => ({
          ...p,
          cantidad: 1,
        }));
      },
      error: (err) => console.error(err),
    });
  }

  // AGREGAR AL CARRITO

  public agregarAlCarrito(p: any) {
    const precioFinal = this.precioConDescuento(p);

    const productoCarrito = {
      id: Number(p.id_producto),
      nombre: p.nombre,
      precio: Number(precioFinal), // ← SIEMPRE número válido
      imagen: p.imagen_url,
      cantidad: Number(p.cantidad),
      stock: Number(p.stock),
    };

    this.carrito.agregarProducto(productoCarrito);

    Swal.fire({
      icon: 'success',
      title: 'Producto agregado',
      text: `${p.cantidad} × ${p.nombre} añadido al carrito`,
      showConfirmButton: false,
      timer: 1500,
      position: 'top-end',
      toast: true,
    });
  }

  // DESCUENTOS

  public precioConDescuento(p: any): number {
    if (!p.precio_oferta || p.precio_oferta <= 0) return p.precio_normal;
    return p.precio_oferta;
  }

  public tieneDescuento(p: any): boolean {
    return p.precio_oferta && p.precio_oferta > 0 && p.precio_oferta < p.precio_normal;
  }
  public porcentajeDescuento(p: any): number {
    if (!p.precio_oferta || p.precio_oferta >= p.precio_normal) return 0;

    return Math.round(((p.precio_normal - p.precio_oferta) / p.precio_normal) * 100);
  }

  // IMÁGENES

  public getImagenUrl(path: string): string {
    if (!path) return 'img/imagenplaceholder.jpg';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `http://localhost:3000${path}`;
    return `http://localhost:3000/img/${path}`;
  }

  public onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'img/imagenplaceholder.jpg';
  }

  // CONTROL DE CANTIDAD
  public aumentarCantidad(p: any) {
    if (p.cantidad < p.stock) {
      p.cantidad++;
    }
  }

  public disminuirCantidad(p: any) {
    if (p.cantidad > 1) {
      p.cantidad--;
    }
  }

  public validarCantidad(p: any) {
    if (p.cantidad < 1) p.cantidad = 1;
    if (p.cantidad > p.stock) p.cantidad = p.stock;
  }
}
