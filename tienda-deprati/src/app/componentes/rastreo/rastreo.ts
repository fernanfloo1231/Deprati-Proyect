// components/rastreo-pedidos/rastreo-pedidos.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Rastreo, RastreoService } from '../../enlace/rastreo.service';
import { Coordenadas, Geolocalizacion } from '../../servicios/geolocalizacion';
import { Pedido } from '../../enlace/pedido.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var L: any;

@Component({
  selector: 'app-rastreo-pedidos',
  imports: [CommonModule, FormsModule],
  templateUrl: './rastreo.html',
  styleUrls: ['./rastreo.css'],
})
export class RastreoPedidosComponent implements OnInit, AfterViewInit, OnDestroy {
  codigoPedido: string = '';
  pedido: Pedido | null = null;
  rastreo: Rastreo | null = null;
  mensaje: string = '';
  estado: string = '';
  estadoClase: string = '';
  buscando: boolean = false;

  private mapa: any;
  private marcadores: any[] = [];
  private polyline: any;

  constructor(private rastreoService: RastreoService, private geolocalizacion: Geolocalizacion) {}

  ngOnInit(): void {
    this.limpiarDatos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const mapDiv = document.getElementById('map');
      if (mapDiv) this.inicializarMapaBasico();
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.mapa) this.mapa.remove();
  }

  estaBuscando(): boolean {
    return this.buscando;
  }

  esMensajeExitoso(): boolean {
    return (
      this.mensaje.includes('correctamente') ||
      this.mensaje.includes('éxito') ||
      this.mensaje.includes('cargado')
    );
  }

  buscarPedido(): void {
    if (!this.codigoPedido.trim()) {
      this.mostrarMensaje('Por favor ingresa un código de pedido');
      return;
    }

    const codigo = this.codigoPedido.trim();
    const numeroExtraido = codigo.replace(/[^0-9]/g, '');

    if (!numeroExtraido) {
      this.mostrarMensaje('El código de pedido debe contener un número válido');
      return;
    }

    const idPedido = parseInt(numeroExtraido);

    this.limpiarDatos();
    this.buscando = true;
    this.mostrarMensaje('Buscando pedido...', 'info');

    this.rastreoService.obtenerRastreoPorPedido(idPedido).subscribe({
      next: (rastreoInfo: Rastreo) => {
        this.buscando = false;

        this.rastreo = rastreoInfo;

        this.pedido = {
          id_pedido: rastreoInfo.id_pedido,
          id_cliente: 0,
          fecha_pedido: rastreoInfo.fecha_actualizacion,
          total: rastreoInfo.total || 0,

          // ✔ AHORA EL ESTADO VIENE DEL PEDIDO REAL (ADMIN)
          estado: this.mapearEstado(
            (rastreoInfo as any).estado_pedido || rastreoInfo.estado_entrega
          ),

          metodo_pago: rastreoInfo.metodo_pago || 'No especificado',
          direccion_entrega: rastreoInfo.direccion_entrega || 'Dirección no disponible',
          observaciones: rastreoInfo.observaciones,
        };

        this.actualizarEstado();
        this.mostrarMensaje('Pedido encontrado correctamente', 'success');
        this.inicializarMapaConRuta();
      },

      error: (error: HttpErrorResponse) => {
        this.buscando = false;

        let mensajeError = 'Error al buscar el pedido. Intente nuevamente.';

        if (error.error?.error) mensajeError = error.error.error;
        else if (error.status === 404) mensajeError = 'Pedido no encontrado.';
        else if (error.status === 401) mensajeError = 'Debe iniciar sesión.';
        else if (error.status === 403) mensajeError = 'No tiene permisos.';
        else if (error.status === 0) mensajeError = 'Error de conexión.';

        this.mostrarMensaje(mensajeError);
      },
    });
  }

  probarMapaSimple(): void {
    this.limpiarDatos();
    this.mostrarMensaje('Cargando mapa de prueba...', 'info');

    setTimeout(() => {
      this.inicializarMapaConRutaPrueba();
      this.mostrarMensaje('Mapa de prueba cargado correctamente', 'success');
    }, 1000);
  }

  private inicializarMapaBasico(): void {
    const mapDiv = document.getElementById('map');

    if (!mapDiv) {
      console.warn(' El contenedor del mapa aún no existe, reintentando...');
      setTimeout(() => this.inicializarMapaBasico(), 200);
      return;
    }

    if (this.mapa) this.mapa.remove();

    const quitoCoords: Coordenadas = { lat: -0.1807, lng: -78.4678 };

    this.mapa = L.map(mapDiv).setView([quitoCoords.lat, quitoCoords.lng], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.mapa);

    L.marker([quitoCoords.lat, quitoCoords.lng])
      .addTo(this.mapa)
      .bindPopup(' Tienda Principal Quito')
      .openPopup();
  }

  private inicializarMapaConRuta(): void {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) {
      console.warn(' No existe el div #map todavía, reintentando...');
      setTimeout(() => this.inicializarMapaConRuta(), 200);
      return;
    }

    if (!this.mapa) {
      console.warn(' Mapa sin inicializar, creando mapa básico...');
      this.inicializarMapaBasico();
      setTimeout(() => this.inicializarMapaConRuta(), 300);
      return;
    }

    if (!this.rastreo) return;

    try {
      const origen = {
        lat: Number(this.rastreo.latitud),
        lng: Number(this.rastreo.longitud),
      };

      const destino = {
        lat: Number(this.rastreo.latitud_destino),
        lng: Number(this.rastreo.longitud_destino),
      };

      this.limpiarMarcadores();

      const centroLat = (origen.lat + destino.lat) / 2;
      const centroLng = (origen.lng + destino.lng) / 2;

      this.mapa.setView([centroLat, centroLng], 8);

      // ORIGEN
      const marcadorOrigen = L.marker([origen.lat, origen.lng], {
        icon: L.divIcon({ html: '🏬', iconSize: [30, 30] }),
      })
        .addTo(this.mapa)
        .bindPopup('🏬 Origen del pedido');

      this.marcadores.push(marcadorOrigen);

      // DESTINO
      const marcadorDestino = L.marker([destino.lat, destino.lng], {
        icon: L.divIcon({ html: '📦', iconSize: [30, 30] }),
      }).addTo(this.mapa).bindPopup(`
        <strong>📦 Destino del Pedido</strong><br>
        ${this.pedido?.direccion_entrega}<br>
        Estado: ${this.rastreo.estado_entrega}
      `);

      this.marcadores.push(marcadorDestino);

      // POLILÍNEA
      if (this.polyline) this.mapa.removeLayer(this.polyline);

      this.polyline = L.polyline(
        [
          [origen.lat, origen.lng],
          [destino.lat, destino.lng],
        ],
        {
          color: '#007bff',
          weight: 4,
          opacity: 0.75,
          dashArray: '10, 10',
        }
      ).addTo(this.mapa);

      const group = new L.FeatureGroup(this.marcadores);
      this.mapa.fitBounds(group.getBounds().pad(0.15));
    } catch (err) {
      console.error('Error cargando mapa:', err);
      this.mostrarMensaje('Error al cargar el mapa, mostrando solo punto de origen');
      this.inicializarMapaBasico();
    }
  }

  private inicializarMapaConRutaPrueba(): void {
    const origen = { lat: -0.1807, lng: -78.4678 };
    const destino = { lat: -2.170998, lng: -79.922359 };

    this.limpiarMarcadores();

    this.mapa.setView([(origen.lat + destino.lat) / 2, (origen.lng + destino.lng) / 2], 8);

    this.marcadores.push(
      L.marker([origen.lat, origen.lng], {
        icon: L.divIcon({ html: '🏬', iconSize: [30, 30] }),
      }).addTo(this.mapa)
    );

    this.marcadores.push(
      L.marker([destino.lat, destino.lng], {
        icon: L.divIcon({ html: '📦', iconSize: [30, 30] }),
      }).addTo(this.mapa)
    );

    this.polyline = L.polyline(
      [
        [origen.lat, origen.lng],
        [destino.lat, destino.lng],
      ],
      {
        color: '#007bff',
        weight: 4,
      }
    ).addTo(this.mapa);
  }

  private limpiarMarcadores(): void {
    this.marcadores.forEach((m) => this.mapa.removeLayer(m));
    this.marcadores = [];

    if (this.polyline) {
      this.mapa.removeLayer(this.polyline);
      this.polyline = null;
    }
  }

  private limpiarDatos(): void {
    this.pedido = null;
    this.rastreo = null;
    this.estado = '';
    this.estadoClase = '';
    this.buscando = false;
  }

  private actualizarEstado(): void {
    if (!this.rastreo) return;

    const estadoFinal = (this.rastreo as any).estado_pedido || this.rastreo.estado_entrega;

    this.estado = estadoFinal;
    this.estadoClase = this.rastreoService.obtenerClaseEstado(estadoFinal);
  }

  private mostrarMensaje(msg: string, tipo: string = 'error'): void {
    this.mensaje = msg;
    if (tipo === 'success') {
      setTimeout(() => {
        if (this.mensaje === msg) this.mensaje = '';
      }, 5000);
    }
  }

  getProgresoEntrega(): number {
    if (!this.pedido) return 0;

    return this.rastreoService.calcularProgresoPorEstado(this.pedido.estado);
  }

  getDescripcionEstado(): string {
    return this.rastreo
      ? this.rastreoService.obtenerDescripcionEstado(this.rastreo.estado_entrega)
      : '';
  }

  isRetrasado(): boolean {
    return this.rastreo ? this.rastreoService.estaRetrasado(this.rastreo.estado_entrega) : false;
  }

  isEntregado(): boolean {
    return this.rastreo ? this.rastreoService.estaEntregado(this.rastreo.estado_entrega) : false;
  }

  getColorPorEstado(estado: string): string {
    return this.rastreoService.obtenerColorEstado(estado);
  }

  private mapearEstado(estadoEntrega: string): string {
    const mapeo: any = {
      Procesando: 'Pendiente',
      Empacado: 'Pendiente',
      'En tránsito': 'Enviado',
      'En reparto': 'Enviado',
      Entregado: 'Entregado',
      Retrasado: 'Enviado',
      Cancelado: 'Cancelado',
    };
    return mapeo[estadoEntrega] || 'Pendiente';
  }
}
