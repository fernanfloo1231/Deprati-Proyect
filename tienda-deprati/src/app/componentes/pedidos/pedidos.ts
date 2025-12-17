import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PedidoService, Pedido } from '../../enlace/pedido.service';
import { CarritoService } from '../../enlace/carrito.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css'],
})
export class PedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  loading: boolean = true;
  error: string = '';
  rastreos: { [key: number]: any } = {};

  constructor(
    private pedidoService: PedidoService,
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log(' PedidosComponent iniciado');
    this.cargarPedidos();
  }

  cargarPedidos() {
    this.loading = true;
    this.error = '';

    console.log(' Iniciando carga de pedidos...');

    this.pedidoService.obtenerPedidos().subscribe({
      next: (response) => {
        this.loading = false;
        console.log(' Respuesta del servicio:', response);

        if (response.success) {
          if (response.pedidos && response.pedidos.length > 0) {
            this.pedidos = response.pedidos;
            console.log(` ${this.pedidos.length} pedidos cargados`);
            this.cargarRastreos();
          } else {
            this.pedidos = [];
            console.log(' No hay pedidos para este usuario');
          }
        } else {
          this.error = 'No se pudieron cargar los pedidos';
          this.pedidos = [];
          console.log(' Success=false en la respuesta');
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error al cargar los pedidos. Por favor, intenta nuevamente.';
        this.pedidos = [];
        console.error(' Error cargando pedidos:', error);
      },
    });
  }

  cargarRastreos() {
    this.pedidos.forEach((pedido) => {
      this.pedidoService.obtenerRastreo(pedido.id_pedido).subscribe({
        next: (response) => {
          if (response.success && response.rastreo) {
            this.rastreos[pedido.id_pedido] = response.rastreo;
          } else {
            // Crear rastreo básico si no existe
            this.rastreos[pedido.id_pedido] = this.crearRastreoBasicoParaPedido(pedido);
          }
        },
        error: (error) => {
          console.error('Error cargando rastreo para pedido', pedido.id_pedido, error);
          this.rastreos[pedido.id_pedido] = this.crearRastreoBasicoParaPedido(pedido);
        },
      });
    });
  }

  private crearRastreoBasicoParaPedido(pedido: Pedido): any {
    let estadoEntrega = 'Procesando';
    let ubicacion = 'Centro de distribución';

    switch (pedido.estado) {
      case 'Enviado':
        estadoEntrega = 'En tránsito';
        ubicacion = 'En camino a destino';
        break;
      case 'Entregado':
        estadoEntrega = 'Entregado';
        ubicacion = 'Entregado';
        break;
      case 'Cancelado':
        estadoEntrega = 'Cancelado';
        ubicacion = 'Pedido cancelado';
        break;
    }

    return {
      estado_entrega: estadoEntrega,
      ubicacion_actual: ubicacion,
      ciudad: pedido.direccion_entrega?.split(',')?.[1]?.trim() || 'Quito',
      fecha_actualizacion: pedido.fecha_pedido,
    };
  }

  getEstadoEntrega(pedidoId: number): string {
    const rastreo = this.rastreos[pedidoId];
    return rastreo?.estado_entrega || 'Procesando';
  }

  getEstadoEntregaClass(estado: string): string {
    const clases: { [key: string]: string } = {
      Procesando: 'rastreo-procesando',
      Empacado: 'rastreo-empacado',
      'En tránsito': 'rastreo-transito',
      'En reparto': 'rastreo-reparto',
      Entregado: 'rastreo-entregado',
      Retrasado: 'rastreo-retrasado',
    };
    return clases[estado] || 'rastreo-procesando';
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      Pendiente: 'estado-pendiente',
      Enviado: 'estado-enviado',
      Entregado: 'estado-entregado',
      Cancelado: 'estado-cancelado',
    };
    return clases[estado] || 'estado-pendiente';
  }

  verDetalles(pedido: Pedido) {
    this.router.navigate(['/pedido-detalle', pedido.id_pedido], {
      state: { pedido },
    });
  }

  rastrearPedido(pedido: Pedido) {
    this.router.navigate(['/rastreo'], {
      queryParams: { codigo: pedido.id_pedido },
    });
  }

  cancelarPedido(pedido: Pedido) {
    if (pedido.estado !== 'Pendiente') {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede cancelar',
        text: 'Solo se pueden cancelar pedidos en estado Pendiente',
      });
      return;
    }

    Swal.fire({
      title: '¿Cancelar pedido?',
      text: `¿Estás seguro de que quieres cancelar el pedido #${pedido.id_pedido}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidoService.cancelarPedido(pedido.id_pedido).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Pedido cancelado',
              text: 'El pedido ha sido cancelado correctamente',
            });
            this.cargarPedidos(); // Recargar lista
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo cancelar el pedido',
            });
          },
        });
      }
    });
  }

  repetirPedido(pedido: Pedido) {
    if (!pedido.productos || pedido.productos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay productos',
        text: 'No se pueden agregar los productos al carrito',
      });
      return;
    }

    // Agregar cada producto al carrito
    pedido.productos.forEach((producto) => {
      const productoCarrito = {
        id: producto.id_producto,
        nombre: producto.nombre,
        precio: producto.precio_unitario,
        cantidad: producto.cantidad,
        stock: 10,
        imagen: producto.imagen_url,
      };
      this.carritoService.agregarProducto(productoCarrito);
    });

    Swal.fire({
      icon: 'success',
      title: 'Productos agregados',
      text: 'Los productos han sido agregados al carrito',
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      this.router.navigate(['/carrito']);
    });
  }

  getTotalProductos(pedido: Pedido): number {
    return pedido.productos?.reduce((total, producto) => total + producto.cantidad, 0) || 0;
  }
}
