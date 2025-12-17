import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Producto } from '../../enlace/producto';
import { ProductoService } from '../../enlace/producto';
import { AuthService } from '../../servicios/admin';
import { Usuarios } from '../../servicios/usuarios';
import { CarritoService } from '../../enlace/carrito.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-card.html',
  styleUrls: ['./producto-card.css'],
})
export class ProductoCard implements OnDestroy {
  @Input() producto!: Producto;
  @Output() agregarAlCarrito = new EventEmitter<Producto>();
  @ViewChild('stockInput') stockInput!: ElementRef;
  @Input() mostrarBadgeOferta: boolean = false;
  @Input() categoria: string = '';

  agregar(producto: Producto) {
    this.agregarAlCarrito.emit(producto);
  }

  isAdmin: boolean = false;
  stockTemporal: number = 0;
  editandoStock: boolean = false;
  cantidadSeleccionada: number = 1;
  private userSubscription: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private productoService: ProductoService,
    private usuarios: Usuarios,
    private carritoService: CarritoService
  ) {
    this.userSubscription = this.usuarios.currentUser$.subscribe((user) => {
      this.checkAdminStatus();
    });
  }

  ngOnInit() {
    this.checkAdminStatus();
    this.stockTemporal = this.producto.stock;
    this.cantidadSeleccionada = 1;
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private checkAdminStatus() {
    const currentUser = this.usuarios.getCurrentUserSync();

    if (currentUser) {
      if (currentUser.provider === 'admin') {
        this.isAdmin = this.authService.isAdminUser();
      } else {
        this.isAdmin = false;
      }
    } else {
      this.isAdmin = this.authService.isAdminUser();
    }

    console.log(' Estado admin:', this.isAdmin, 'Usuario:', currentUser);
  }

  // Métodos para manejar cantidad
  aumentarCantidad() {
    if (this.cantidadSeleccionada < this.producto.stock) {
      this.cantidadSeleccionada++;
    }
  }

  disminuirCantidad() {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
    }
  }

  validarCantidad() {
    if (this.cantidadSeleccionada < 1) {
      this.cantidadSeleccionada = 1;
    }
    if (this.cantidadSeleccionada > this.producto.stock) {
      this.cantidadSeleccionada = this.producto.stock;
    }
  }

  precioConDescuento(p: Producto): number {
    if (!p.precio_oferta || p.precio_oferta <= 0) {
      return p.precio_normal;
    }
    return p.precio_oferta;
  }

  tieneDescuento(p: Producto): boolean {
    return !!(p.precio_oferta && p.precio_oferta > 0 && p.precio_oferta < p.precio_normal);
  }

  porcentajeDescuento(p: Producto): number {
    if (!this.tieneDescuento(p)) return 0;
    return Math.round(((p.precio_normal - p.precio_oferta!) / p.precio_normal) * 100);
  }

  verDetalle(producto: any) {
    this.router.navigate(['/producto', producto.id_producto]);
  }

  onAgregarAlCarrito(p: Producto) {
    //  AGREGAR ESTE CONSOLE.LOG TEMPORAL
    console.log(' BOTÓN PRESIONADO - onAgregarAlCarrito llamado con:', p);

    const precio = this.asegurarNumero(this.precioConDescuento(p));
    const stock = this.asegurarNumero(p.stock);

    const productoCarrito = {
      id: this.asegurarNumero(p.id_producto),
      nombre: p.nombre || 'Producto sin nombre',
      precio: precio,
      imagen: p.imagen_url,
      cantidad: this.cantidadSeleccionada,
      stock: stock,
    };

    this.carritoService.agregarProducto(productoCarrito);
    this.agregarAlCarrito.emit(p);

    // Resetear cantidad después de agregar
    this.cantidadSeleccionada = 1;
  }

  // Métodos de stock (solo para admin)
  aumentarStockTemporal(cantidad: number = 1) {
    this.stockTemporal = Math.max(0, this.stockTemporal + cantidad);
    this.editandoStock = true;
  }

  disminuirStockTemporal(cantidad: number = 1) {
    this.stockTemporal = Math.max(0, this.stockTemporal - cantidad);
    this.editandoStock = true;
  }

  onStockInputChange(event: any) {
    const nuevoValor = parseInt(event.target.value, 10);
    if (!isNaN(nuevoValor) && nuevoValor >= 0) {
      this.stockTemporal = nuevoValor;
      this.editandoStock = true;
    }
  }

  aplicarCambioStock() {
    if (this.stockTemporal < 0) {
      alert('El stock no puede ser negativo');
      this.stockTemporal = this.producto.stock;
      return;
    }

    if (this.stockTemporal === this.producto.stock) {
      this.editandoStock = false;
      return;
    }

    this.productoService.updateStock(this.producto.id_producto!, this.stockTemporal).subscribe({
      next: (response) => {
        console.log('Stock actualizado:', response);
        this.producto.stock = this.stockTemporal;
        this.editandoStock = false;
        this.mostrarMensajeExito(`Stock actualizado a ${this.stockTemporal}`);
      },
      error: (err) => {
        console.error('Error actualizando stock:', err);
        this.stockTemporal = this.producto.stock;
        this.editandoStock = false;
        alert('Error al actualizar el stock');
      },
    });
  }

  cancelarCambioStock() {
    this.stockTemporal = this.producto.stock;
    this.editandoStock = false;
  }

  private mostrarMensajeExito(mensaje: string) {
    const mensajeElement = document.createElement('div');
    mensajeElement.textContent = mensaje;
    mensajeElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
    `;
    document.body.appendChild(mensajeElement);

    setTimeout(() => {
      document.body.removeChild(mensajeElement);
    }, 2000);
  }

  getImagenUrl(imagenPath: any): string {
    console.log(' getImagenUrl recibió:', imagenPath, 'tipo:', typeof imagenPath);

    if (!imagenPath) {
      console.log(' imagenPath está vacío, usando placeholder');
      return 'img/imagenplaceholder.jpg';
    }

    const path = String(imagenPath).trim();

    if (path === '') {
      console.log(' path está vacío después de trim');
      return 'img/imagenplaceholder.jpg';
    }

    console.log(' Procesando path:', path);

    if (path.startsWith('http')) {
      const finalUrl = path;
      console.log(' URL completa:', finalUrl);
      return finalUrl;
    }

    if (path.startsWith('/')) {
      const finalUrl = `http://localhost:3000${path}`;
      console.log(' URL construida con /:', finalUrl);
      return finalUrl;
    }

    if (path.startsWith('img/')) {
      const finalUrl = `http://localhost:3000/${path}`;
      console.log(' URL construida con img/:', finalUrl);
      return finalUrl;
    }

    const finalUrl = `http://localhost:3000/img/${path}`;
    console.log(' URL construida normal:', finalUrl);
    return finalUrl;
  }

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    console.warn(' Error cargando imagen, usando placeholder');
    imgElement.src = 'img/imagenplaceholder.jpg';
    imgElement.onerror = null;
  }

  onStockInputFocus() {
    this.editandoStock = true;
  }

  onStockInputBlur() {
    setTimeout(() => {
      this.editandoStock = false;
    }, 200);
  }

  /** Método auxiliar para asegurar números */
  private asegurarNumero(valor: any): number {
    if (valor === null || valor === undefined || valor === '') {
      return 0;
    }

    const numero = Number(valor);
    return isNaN(numero) ? 0 : numero;
  }
}
