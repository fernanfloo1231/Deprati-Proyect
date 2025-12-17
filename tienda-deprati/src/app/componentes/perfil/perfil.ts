import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Usuarios, UsuarioData } from '../../servicios/usuarios';
import { PedidoService } from '../../enlace/pedido.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class Perfil {
  user: UsuarioData | null = null;
  pedidos: any[] = [];
  loading: boolean = false;

  constructor(
    private readonly usuarios: Usuarios,
    private pedidoService: PedidoService,
    private router: Router
  ) {
    this.usuarios.currentUser$.subscribe((u) => {
      this.user = u;
      if (u) this.loadPedidos();
    });
  }
  logout() {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Tu sesión actual será cerrada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Cerrar sesión
        this.usuarios.clearUser();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Sesión cerrada correctamente',
          showConfirmButton: false,
          timer: 1500,
        });

        this.router.navigate(['/home']);
      }
    });
  }
  private loadPedidos() {
    this.loading = true;

    this.pedidoService.obtenerPedidos().subscribe({
      next: (response) => {
        this.loading = false;

        if (response.success && response.pedidos?.length > 0) {
          this.pedidos = response.pedidos.slice(0, 3);
        } else {
          this.pedidos = [];
        }
      },
      error: (error) => {
        this.loading = false;
        this.pedidos = [];

        Swal.fire({
          icon: 'error',
          title: 'Error al cargar pedidos',
          text: 'No fue posible obtener tus pedidos, intenta más tarde.',
        });
      },
    });
  }

  verTodosLosPedidos() {
    this.router.navigate(['/pedidos']);
  }

  rastrearPedido(idPedido: number) {
    this.router.navigate(['/rastreo'], {
      queryParams: { codigo: idPedido },
    });
  }

  getEstadoEntrega(pedido: any): string {
    if (pedido.estado === 'Cancelado') return 'Cancelado';
    if (pedido.estado === 'Entregado') return 'Entregado';

    const fechaPedido = new Date(pedido.fecha_pedido);
    const hoy = new Date();
    const diffDias = Math.floor((hoy.getTime() - fechaPedido.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias >= 3) return 'En reparto';
    if (diffDias >= 1) return 'En tránsito';
    return 'Procesando';
  }
}
