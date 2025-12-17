import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService, CrearPedidoRequest } from '../../enlace/pedido.service';
import Swal from 'sweetalert2';
import { CarritoService, ProductoCarrito } from '../../enlace/carrito.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class CheckoutComponent implements OnInit {
  productos: ProductoCarrito[] = [];
  loading: boolean = false;

  pasoActual: number = 1; 
  procesandoPago: boolean = false;

  nombre: string = '';
  apellidos: string = '';
  cedula: string = '';
  telefono: string = '';

  direccionEntrega: string = '';
  observaciones: string = '';

  metodoPago: string = 'Tarjeta';

  // Datos de tarjeta
  numeroTarjeta: string = '4242 4242 4242 4242';
  nombreTitular: string = 'Juan Pérez';
  fechaExpiracion: string = '12/25';
  cvv: string = '123';

  estadoPagoVisual: 'Pagado' | 'Pendiente' = 'Pendiente';
  mensajePagoVisual: string = '';

  constructor(
    private router: Router,
    public carritoService: CarritoService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit() {
    this.cargarProductos();
    this.verificarAutenticacion();
  }

  cargarProductos() {
    this.productos = this.carritoService.obtenerProductos();

    if (this.productos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'No hay productos en el carrito',
      }).then(() => {
        this.router.navigate(['/carrito']);
      });
    }
  }

  verificarAutenticacion() {
    if (!this.carritoService.estaAutenticadoPublico()) {
      Swal.fire({
        icon: 'warning',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para realizar un pedido',
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Seguir comprando',
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['/carrito']);
        }
      });
    }
  }

  // Paso 1: Identificación (NUEVO)
  validarIdentificacion(): boolean {
    return (
      this.nombre.trim().length > 2 &&
      this.apellidos.trim().length > 2 &&
      this.cedula.length === 10 &&
      this.telefono.trim().length >= 7
    );
  }

  // Paso 2: Envío
  validarPaso1(): boolean {
    return this.direccionEntrega.trim().length >= 10;
  }

  // Paso 3: Pago
  validarTarjeta(): boolean {
    if (this.metodoPago !== 'Tarjeta') return true;

    return (
      this.numeroTarjeta.replace(/\s/g, '').length === 16 &&
      this.nombreTitular.trim().length >= 3 &&
      this.fechaExpiracion.length === 5 &&
      this.cvv.length === 3
    );
  }

  siguientePaso() {
    // Paso 1 → 2
    if (this.pasoActual === 1 && !this.validarIdentificacion()) {
      Swal.fire('Error', 'Completa correctamente tus datos de identificación', 'error');
      return;
    }

    // Paso 2 → 3
    if (this.pasoActual === 2 && !this.validarPaso1()) {
      Swal.fire('Error', 'Ingresa una dirección válida (mínimo 10 caracteres)', 'error');
      return;
    }

    // Paso 3 → 4
    if (this.pasoActual === 3 && !this.validarTarjeta()) {
      Swal.fire('Error', 'Verifica los datos de pago', 'error');
      return;
    }

    // Preparar estados VISUALES antes de confirmación
    if (this.pasoActual === 3) {
      if (this.metodoPago === 'Tarjeta') {
        this.estadoPagoVisual = 'Pagado';
        this.mensajePagoVisual = 'Pago aprobado correctamente (simulado)';
      } else {
        this.estadoPagoVisual = 'Pendiente';
        this.mensajePagoVisual =
          'Pedido registrado. El pago será validado posteriormente (simulado)';
      }
    }

    this.pasoActual++;
  }

  pasoAnterior() {
    this.pasoActual--;
  }

  getSubtotal(): number {
    return this.productos.reduce(
      (total, producto) => total + producto.precio * producto.cantidad,
      0
    );
  }

  getEnvio(): number {
    return 5.0;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getEnvio();
  }

  async procesarPedido() {
    this.procesandoPago = true;

    try {
      await this.simularProcesamientoPago();

      const pedidoData: CrearPedidoRequest = {
        metodo_pago: this.metodoPago,
        direccion_entrega: this.direccionEntrega,
        observaciones: this.observaciones,
        productos: this.productos.map((producto) => ({
          id_producto: producto.id,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio,
        })),
      };

      this.pedidoService.crearPedido(pedidoData).subscribe({
        next: (response: any) => {
          this.procesandoPago = false;

          if (response.success) {
            this.mostrarExito(response.pedido);
            this.carritoService.vaciarCarrito().subscribe(() => {
              this.router.navigate(['/pedidos']);
            });
          } else {
            this.mostrarError(response.error || 'No se pudo crear el pedido');
          }
        },
        error: () => {
          this.procesandoPago = false;
          this.mostrarError('Error de conexión con el servidor');
        },
      });
    } catch {
      this.procesandoPago = false;
      this.mostrarError('Error en el procesamiento de pago');
    }
  }

  private simularProcesamientoPago(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1500));
  }

  private mostrarExito(pedido: any) {
    Swal.fire({
      icon: 'success',
      title: '¡Pedido realizado!',
      html: `
        <p><strong>Pedido:</strong> #${pedido.id_pedido}</p>
        <p><strong>Total:</strong> $${this.formatearNumero(pedido.total)}</p>
        <p><strong>Método:</strong> ${pedido.metodo_pago}</p>
        <p><strong>Estado:</strong> ${this.estadoPagoVisual}</p>
        <small>Proceso simulado – Proyecto universitario</small>
      `,
      confirmButtonText: 'Ver mis pedidos',
    });
  }

  private mostrarError(mensaje: string) {
    Swal.fire('Error', mensaje, 'error');
  }

  formatearNumeroTarjeta(event: any) {
    let value = event.target.value.replace(/\D/g, '').substring(0, 16);
    this.numeroTarjeta = value.replace(/(\d{4})/g, '$1 ').trim();
  }

  formatearFechaExpiracion(event: any) {
    let value = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
    this.fechaExpiracion = value;
  }

  private formatearNumero(valor: any): string {
    const numero = Number(valor);
    return isNaN(numero) ? '0.00' : numero.toFixed(2);
  }
}
