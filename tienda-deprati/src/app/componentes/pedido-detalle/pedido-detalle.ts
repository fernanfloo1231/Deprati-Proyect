import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../enlace/pedido.service';

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedido-detalle.html',
  styleUrls: ['./pedido-detalle.css'],
})
export class PedidoDetalleComponent implements OnInit {
  pedido: any = null;
  loading: boolean = true;
  error: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pedidoService: PedidoService
  ) {
    //  Recibir datos enviados desde /pedidos
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state?.['pedido']) {
      this.pedido = nav.extras.state['pedido'];
      this.loading = false;
    }
  }

  ngOnInit(): void {
    //  Si ya vino el pedido desde navegación, no necesitamos el backend
    if (this.pedido) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.error = 'ID de pedido inválido';
      this.loading = false;
      return;
    }

    //  Cargar pedido desde API
    this.pedidoService.obtenerPedido(id).subscribe({
      next: (res) => {
        this.pedido = res.pedido;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el pedido';
        this.loading = false;
      },
    });
  }
}
