import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { ChatbotComponent } from '../chatbot/chatbot';
import { Valoraciones } from '../valoraciones/valoraciones';
import { CarritoService } from '../../enlace/carrito.service';
import { ClientesService } from '../../enlace/clientes.service.ts';
import { ProductoService, Producto } from '../../enlace/producto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, CurrencyPipe, ChatbotComponent, Valoraciones],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  productosEnOferta: Producto[] = [];
  productosRotando: Producto[] = [];

  rotacionInterval: any;

  @ViewChild('carousel', { static: false }) carousel: any;

  slides = [
    'img/deslizante1.jpg',
    'img/deslizante2.jpg',
    'img/deslizante3.jpg',
    'img/deslizante4.jpg',
  ];
  currentSlide = 0;
  autoSlide: any;

  isChatOpen = false;
  isValoracionesOpen = false;

  constructor(
    private router: Router,
    private carritoService: CarritoService,
    private clientesService: ClientesService,
    private productoService: ProductoService
  ) {}

  ngOnInit() {
    this.manejarTokenSocial();
    this.cargarOfertasHome();
    this.startAutoSlide();
  }

  ngAfterViewInit() {
    setInterval(() => {
      this.moverCarrusel(1);
    }, 4000);
  }

  irAOfertas() {
    this.router.navigate(['/ofertas']);
  }

  cargarOfertasHome() {
    this.productoService.getProductosByCategoria('Mujeres').subscribe((m) => {
      this.productoService.getProductosByCategoria('Hombres').subscribe((h) => {
        this.productoService.getProductosByCategoria('Belleza').subscribe((b) => {
          this.productoService.getProductosByCategoria('Hogar').subscribe((g) => {
            this.productoService.getProductosByCategoria('Tecnologia').subscribe((t) => {
              const todos = [...m, ...h, ...b, ...g, ...t];

              this.productosEnOferta = todos.filter(
                (p) => p.precio_oferta && p.precio_oferta > 0 && p.precio_oferta < p.precio_normal
              );

              this.productosRotando = this.productosEnOferta.slice(0, 4);

              this.iniciarRotacion();
            });
          });
        });
      });
    });
  }

  iniciarRotacion() {
    if (this.productosEnOferta.length <= 4) return;

    this.rotacionInterval = setInterval(() => {
      const primero = this.productosEnOferta.shift();
      this.productosEnOferta.push(primero!);

      this.productosRotando = this.productosEnOferta.slice(0, 4);
    }, 5000);
  }

  private manejarTokenSocial() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const cliente = urlParams.get('cliente');

    if (token && cliente) {
      try {
        localStorage.setItem('token', token);
        const clienteData = JSON.parse(decodeURIComponent(cliente));
        localStorage.setItem('cliente', JSON.stringify(clienteData));

        this.carritoService.afterLoginSincronizacion();
        window.history.replaceState({}, document.title, '/home');
      } catch (error) {
        console.error('Error procesando token social:', error);
      }
    }
  }

  getImagenUrl(p: any): string {
    if (p.imagen_url && p.imagen_url.startsWith('http')) {
      return p.imagen_url;
    }

    if (p.imagen_url) {
      return `http://localhost:3000${p.imagen_url}`;
    }

    if (p.imagen) {
      return p.imagen;
    }

    return 'img/imagenplaceholder.jpg';
  }

  moverCarrusel(direccion: number) {
    if (!this.carousel) return;

    const ancho = this.carousel.nativeElement.clientWidth;
    this.carousel.nativeElement.scrollBy({
      left: direccion * (ancho * 0.8),
      behavior: 'smooth',
    });
  }

  startAutoSlide() {
    this.autoSlide = setInterval(() => this.nextSlide(), 4000);
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.updateSlidePosition();
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.updateSlidePosition();
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.updateSlidePosition();
  }

  updateSlidePosition() {
    const slides = document.querySelector('.slides') as HTMLElement;
    if (slides) {
      slides.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }
  }

  verProductoEnCategoria(p: any) {
    console.log(' Producto recibido:', p);

    // Normalizar categoría
    const categoriaBruta = p.categoria || p.categoria_nombre || p.id_categoria || '';

    const categoria = categoriaBruta.toString().toLowerCase();

    console.log(' Categoría detectada:', categoria);

    const rutas: any = {
      mujeres: '/mujeres',
      mujer: '/mujeres',
      hombres: '/hombres',
      hombre: '/hombres',
      belleza: '/belleza',
      hogar: '/hogar',
      tecnologia: '/tecnologia',
      tecnología: '/tecnologia',
    };

    // Si la categoría es numérica, mapear según tu BD
    const categoriasNumericas: any = {
      1: '/mujeres',
      2: '/hombres',
      3: '/belleza',
      4: '/hogar',
      5: '/tecnologia',
    };

    // Si coincide con un nombre
    if (rutas[categoria]) {
      console.log('➡️ Redirigiendo a:', rutas[categoria]);
      this.router.navigate([rutas[categoria]], { state: { producto: p } });
      return;
    }

    // Si coincide con ID numérica
    if (categoriasNumericas[categoria]) {
      console.log('➡️ Redirigiendo por ID a:', categoriasNumericas[categoria]);
      this.router.navigate([categoriasNumericas[categoria]], { state: { producto: p } });
      return;
    }

    console.warn(' Categoría no reconocida, yendo al detalle.');
    this.verMas(p);
  }

  toggleValoraciones() {
    this.isValoracionesOpen = !this.isValoracionesOpen;
    if (this.isValoracionesOpen) this.isChatOpen = false;
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) this.isValoracionesOpen = false;
  }

  verMas(producto: any) {
    this.router.navigate(['/producto', producto.nombre], { state: { producto } });
  }

  agregarAlCarrito(producto: any) {
    this.carritoService.agregarProducto(producto);
    alert(` ${producto.nombre} agregado al carrito.`);
  }

  ngOnDestroy() {
    clearInterval(this.autoSlide);
    clearInterval(this.rotacionInterval);
  }
}
