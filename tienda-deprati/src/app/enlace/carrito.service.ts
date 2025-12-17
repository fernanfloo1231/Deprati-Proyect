import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

export interface ProductoCarrito {
  id: number;
  nombre: string;
  precio_real: number;        // precio final (oferta o normal)
  precio_original?: number;   // precio normal
  descuento?: number;
  precio: number;
  imagen: string;
  cantidad: number;
  stock: number;
  precio_unitario?: number;
  subtotal?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private productos: ProductoCarrito[] = [];
  private carritoCountSubject = new BehaviorSubject<number>(0);
  carritoCount$ = this.carritoCountSubject.asObservable();
  private productosSubject = new BehaviorSubject<ProductoCarrito[]>([]);
  productos$ = this.productosSubject.asObservable();
  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  private apiUrl = 'http://localhost:3000/carrito';

  constructor(private http: HttpClient, private router: Router) {
    this.cargarCarritoLocal();
  }

  //  MÉTODO LIMPIAR CARRITO COMPLETAMENTE (solo para casos específicos)
  limpiarCarrito(): void {
    console.log('🧹 LIMPIANDO CARRITO COMPLETAMENTE...');

    // 1. Limpiar array local
    this.productos = [];

    // 2. Limpiar localStorage del carrito
    localStorage.removeItem('carrito');

    // 3. Resetear contadores
    this.carritoCountSubject.next(0);
    this.productosSubject.next([]);

    // 4. Limpiar carrito en backend si está autenticado
    if (this.estaAutenticado()) {
      this.vaciarCarrito().subscribe({
        next: (response) => {
          console.log(' Carrito limpiado en backend:', response);
        },
        error: (error) => {
          console.error(' Error limpiando carrito en backend:', error);
        },
      });
    }

    console.log(' Carrito limpiado completamente');
  }

  //  Obtener headers con token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('cliente_token') || localStorage.getItem('token');
    if (token) {
      return new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  // Sincronizar carrito después del login - MEJORADO
  sincronizarConBackend(): Observable<any> {
    const productosLocal = this.obtenerProductos();
    return this.http.post(
      `${this.apiUrl}/sincronizar`,
      { productos: productosLocal },
      { headers: this.getHeaders() }
    );
  }

  //  Cargar carrito desde backend
  cargarCarritoBackend(): Observable<any> {
    return this.http.get(`${this.apiUrl}`, { headers: this.getHeaders() });
  }

  agregarProducto(producto: any, accion: 'nuevo' | 'sumar' = 'nuevo'): void {
    console.log(' FRONT - Agregar producto:', producto);

    // Si NO está autenticado → modo local
    if (!this.estaAutenticado()) {
      this.agregarProductoLocal(producto);
      return;
    }

    // Si está autenticado → usar backend
    this.agregarProductoBackend(producto.id, producto.cantidad || 1, accion).subscribe({
      next: (response: any) => {
        console.log(' Producto agregado desde backend', response);

        // Recargar carrito desde backend
        this.cargarCarritoDesdeBackend();
        document.dispatchEvent(new Event('stock-actualizado'));
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: `${producto.nombre} agregado al carrito.`,
          timer: 1500,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
        });
      },

      error: (error) => {
        console.error(' Error desde backend:', error);

        Swal.fire({
          icon: 'error',
          title: 'Stock insuficiente',
          text: error.error?.error || 'No se pudo agregar al carrito.',
        });
      },
    });
  }

  private agregarProductoBackend(
    id_producto: number,
    cantidad: number,
    accion: 'nuevo' | 'sumar' = 'nuevo'
  ): Observable<any> {
    const body = {
      id_producto,
      cantidad,
      accion: accion === 'sumar' ? 'sumar' : 'reemplazar',
    };

    console.log(' FRONTEND - Enviando request:', {
      url: `${this.apiUrl}/agregar`,
      method: 'POST',
      body: body,
      headers: this.getHeaders(),
    });

    return this.http.post(`${this.apiUrl}/agregar`, body, { headers: this.getHeaders() });
  }

  //  Actualizar cantidad (local + backend)
  actualizarCantidadPorIndex(index: number, cantidad: number): void {
    if (index < 0 || index >= this.productos.length) return;

    const producto = this.productos[index];
    const cantidadNum = this.asegurarNumero(cantidad);

    // Validar stock
    if (producto.stock > 0 && cantidadNum > producto.stock) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${producto.stock} unidades disponibles`,
      });
      return;
    }

    this.productos[index].cantidad = Math.max(1, cantidadNum);
    this.calcularSubtotal(index);
    this.emitirCambios();

    // Sincronizar con backend si está autenticado
    if (this.estaAutenticado()) {
      this.actualizarCantidadBackend(producto.id, cantidadNum).subscribe({
        next: () => {
          this.cargarCarritoDesdeBackend(); // Recargar datos correctos
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo actualizar cantidad',
            text: error.error?.error || 'Hubo un problema con el stock',
          });

          // Recargar carrito correcto desde backend
          this.cargarCarritoDesdeBackend();
        },
      });
    }
  }

  private actualizarCantidadBackend(id_producto: number, cantidad: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/actualizar/${id_producto}`,
      { cantidad },
      { headers: this.getHeaders() }
    );
  }

  //  Eliminar producto
  eliminarProductoPorIndex(index: number): void {
    if (index < 0 || index >= this.productos.length) return;

    const producto = this.productos[index];
    if (this.estaAutenticado()) {
      this.eliminarProductoBackend(producto.id).subscribe({
        next: () => {
          this.productos.splice(index, 1);
          this.emitirCambios();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: error.error?.error || 'No se pudo eliminar el producto del carrito',
          });

          this.cargarCarritoDesdeBackend();
        },
      });
    } else {
      // Modo local
      this.productos.splice(index, 1);
      this.emitirCambios();
    }
  }

  private eliminarProductoBackend(id_producto: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id_producto}`, {
      headers: this.getHeaders(),
    });
  }

  //  Vaciar carrito
  vaciarCarrito(): Observable<any> {
    this.productos = [];
    this.emitirCambios();

    // Sincronizar con backend si está autenticado
    if (this.estaAutenticado()) {
      return this.http.delete(`${this.apiUrl}/vaciar`, { headers: this.getHeaders() });
    } else {
      return new Observable((observer) => {
        observer.next({ message: 'Carrito vaciado localmente' });
        observer.complete();
      });
    }
  }

  afterLoginSincronizacion(): void {
    if (this.estaAutenticado()) {
      console.log('🔄 Sincronizando carrito después del login...');

      //  Limpiar cualquier producto inválido local
      this.limpiarProductosInvalidos();

      //  Cargar carrito desde backend
      this.cargarCarritoDesdeBackend()
        .then(() => {
          console.log(' Carrito del usuario cargado desde BD');

          //  TESolo sincronizar si hay productos locales válidos
          const productosLocales = this.obtenerProductos().filter(
            (p) => p.id && p.nombre && p.precio > 0
          );

          if (productosLocales.length > 0) {
            console.log(' Sincronizando productos locales válidos con BD...', productosLocales);
            this.sincronizarConBackend().subscribe({
              next: (response: any) => {
                console.log(' Carrito sincronizado después del login:', response);
                // Recargar carrito desde BD para tener datos actualizados
                this.cargarCarritoDesdeBackend();
              },
              error: (error) => {
                console.error(' Error sincronizando carrito después del login:', error);
              },
            });
          } else {
            console.log(' No hay productos locales válidos para sincronizar');
          }
        })
        .catch((error) => {
          console.error(' Error cargando carrito desde BD:', error);
        });
    } else {
      console.log(' Usuario no autenticado, no se sincroniza carrito');
    }
  }
  private limpiarProductosInvalidos(): void {
    const productosInvalidos = this.productos.filter(
      (p) => !p.id || !p.nombre || p.precio <= 0 || isNaN(p.cantidad) || p.cantidad <= 0
    );

    if (productosInvalidos.length > 0) {
      console.log('🧹 Limpiando productos inválidos:', productosInvalidos);
      this.productos = this.productos.filter(
        (p) => p.id && p.nombre && p.precio > 0 && !isNaN(p.cantidad) && p.cantidad > 0
      );
      this.emitirCambios();
    }
  }

  //  Cargar carrito desde backend (método auxiliar) - CONVERTIDO A PROMESA
  private cargarCarritoDesdeBackend(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Iniciando carga de carrito desde backend...');

      this.cargarCarritoBackend().subscribe({
        next: (carritoBD: any) => {
          console.log(' Respuesta completa del backend:', carritoBD);

          if (carritoBD.success && carritoBD.carrito && carritoBD.carrito.productos) {
            const productosBD = carritoBD.carrito.productos;
            console.log(' Productos recibidos del backend:', productosBD);

            // FILTRAR productos válidos del backend
            const productosValidos = productosBD
              .filter(
                (producto: any) =>
                  producto.id_producto ||
                  (producto.id &&
                    producto.nombre &&
                    (producto.precio || producto.precio_unitario) > 0)
              )
              .map((producto: any) => {
  const precioReal =
    producto.precio_real ??
    producto.precio_unitario ??
    producto.precio ??
    0;

  const precioOriginal =
    producto.precio_original ?? precioReal;

  return {
    id: producto.id_producto || producto.id,
    nombre: producto.nombre || 'Producto sin nombre',

    precio_real: precioReal,
    precio_original: precioOriginal,
    descuento: producto.descuento ?? null,

    // compatibilidad con lógica existente
    precio: precioReal,

    cantidad: producto.cantidad || 1,
    stock: producto.stock || 0,
    imagen: producto.imagen || producto.imagen_url || '',
    subtotal: precioReal * (producto.cantidad || 1),
  };
});


            console.log(' Productos válidos procesados:', productosValidos);

            if (productosValidos.length > 0) {
              this.productos = productosValidos;
              this.emitirCambios();
              console.log(
                ' Carrito cargado desde BD con',
                productosValidos.length,
                'productos válidos'
              );
            } else {
              console.log('📭 Carrito vacío en BD o todos los productos son inválidos');
              this.productos = [];
              this.emitirCambios();
            }
          } else {
            console.log(' Carrito vacío en BD (success=false o sin productos)');
            this.productos = [];
            this.emitirCambios();
          }
          resolve();
        },
        error: (error) => {
          console.error(' Error cargando carrito desde BD:', error);
          // En caso de error, mantener carrito local limpio
          this.productos = [];
          this.emitirCambios();
          reject(error);
        },
      });
    });
  }

  //  Verificar si el usuario está autenticado
  private estaAutenticado(): boolean {
    const tokenCliente = localStorage.getItem('cliente_token');
    const tokenGeneral = localStorage.getItem('token');
    const estaAutenticado = !!(tokenCliente || tokenGeneral);

    return estaAutenticado;
  }

  //  MÉTODO PARA ACTUALIZAR CONTADOR
  actualizarContador(): void {
    console.log(' Actualizando contador del carrito...');
    this.actualizarContadorInterno();
  }

  private cargarCarritoLocal(): void {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      try {
        this.productos = JSON.parse(carritoGuardado);
        console.log(' Carrito local cargado:', this.productos.length, 'productos');
        this.actualizarContadorInterno();
      } catch (error) {
        this.productos = [];
        this.actualizarContadorInterno();
      }
    }
  }

 private normalizarProducto(producto: any): any {
  const cantidadNum = Number(producto.cantidad);
  const cantidadFinal = !isNaN(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1;

  const precioFinal =
    producto.precio_oferta && producto.precio_oferta > 0
      ? producto.precio_oferta
      : producto.precio_normal ?? producto.precio;

  return {
    id: producto.id || producto.id_producto,
    nombre: producto.nombre,
    precio: precioFinal, // 
    imagen: producto.imagen || producto.imagen_url,
    cantidad: cantidadFinal,
    stock: producto.stock ?? 0,
    subtotal: precioFinal * cantidadFinal,
  };
}


  private asegurarNumero(valor: any): number {
    if (valor === null || valor === undefined || valor === '') {
      return 1; // Valor por defecto
    }

    const numero = Number(valor);

    if (isNaN(numero) || numero <= 0) {
      return 1; // Si escribe 0, negativo o texto → 1
    }

    return numero;
  }

  private guardarCarritoLocal(): void {
    localStorage.setItem('carrito', JSON.stringify(this.productos));
  }

  private agregarProductoLocal(producto: any): void {
    const productoNormalizado = this.normalizarProducto(producto);

    const existenteIndex = this.productos.findIndex((p) => p.id === productoNormalizado.id);

    if (existenteIndex !== -1) {
      this.notificarProductoExistente(productoNormalizado, existenteIndex);
    } else {
      this.productos.push(productoNormalizado);
      this.emitirCambios();
      this.guardarCarritoLocal();

      if (this.estaAutenticado()) {
        console.log(' Producto NUEVO - Sincronizando con backend...');
        this.agregarProductoBackend(
          productoNormalizado.id,
          productoNormalizado.cantidad,
          'nuevo'
        ).subscribe({
          next: (response: any) => {
            console.log(' Producto NUEVO agregado a BD:', response);
          },
          error: (error) => {
            console.error(' Error agregando producto NUEVO a BD:', error);
          },
        });
      }

      Swal.fire({
        icon: 'success',
        title: '¡Agregado!',
        text: `${productoNormalizado.nombre} agregado al carrito`,
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    }
  }

  private notificarProductoExistente(nuevoProducto: any, existenteIndex: number): void {
    const productoExistente = this.productos[existenteIndex];
    const stockDisponible = productoExistente.stock;
    const cantidadTotalSiSuma = productoExistente.cantidad + nuevoProducto.cantidad;

    const puedeSumar = stockDisponible >= cantidadTotalSiSuma;

    let mensajeStock = '';
    if (!puedeSumar) {
      mensajeStock = `<p style="color: #e74c3c; font-weight: bold;"> No hay suficiente stock. Máximo: ${stockDisponible}</p>`;
    }

    Swal.fire({
      title: 'Ya está en el carrito',
      html: `
        <div style="text-align: left;">
            <p><strong>${productoExistente.nombre}</strong> ya está en tu carrito.</p>
            <p>• Cantidad actual: <strong>${productoExistente.cantidad}</strong></p>
            <p>• Nueva cantidad: <strong>${nuevoProducto.cantidad}</strong></p>
            <p>• Stock disponible: <strong>${stockDisponible}</strong></p>
            ${mensajeStock}
        </div>
        `,
      icon: 'info',
      showDenyButton: puedeSumar,
      showCancelButton: true,
      confirmButtonText: 'Ir al carrito',
      denyButtonText: `Sumar (${productoExistente.cantidad} + ${nuevoProducto.cantidad})`,
      cancelButtonText: 'Seguir comprando',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.irAlCarrito();
      } else if (result.isDenied) {
        this.sumarCantidades(existenteIndex, nuevoProducto.cantidad);
      }
    });
  }

  private sumarCantidades(index: number, cantidadASumar: number): void {
    const producto = this.productos[index];

    this.productos[index].cantidad += cantidadASumar;
    this.calcularSubtotal(index);
    this.emitirCambios();
    this.guardarCarritoLocal();

    if (this.estaAutenticado()) {
      this.agregarProductoBackend(producto.id, cantidadASumar, 'sumar').subscribe({
        next: (response: any) => {
          console.log(' Cantidades sumadas en BD:', response);
        },
        error: (error) => {
          console.error(' Error sumando cantidades en BD:', error);
        },
      });
    }

    Swal.fire({
      icon: 'success',
      title: '¡Cantidades sumadas!',
      text: `Ahora tienes ${this.productos[index].cantidad} unidades en el carrito`,
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
    });
  }

  private irAlCarrito(): void {
    this.router.navigate(['/carrito']);
  }

  private calcularSubtotal(index: number): void {
  if (index < 0 || index >= this.productos.length) return;
  const producto = this.productos[index];

  const precio = producto.precio_real ?? producto.precio ?? 0;
  producto.subtotal = precio * producto.cantidad;
}


  obtenerProductos(): ProductoCarrito[] {
    return [...this.productos];
  }

  getImagenUrl(imagenPath: any): string {
    if (!imagenPath) {
      return 'img/imagenplaceholder.jpg';
    }

    const path = String(imagenPath).trim();

    if (path === '') {
      return 'img/imagenplaceholder.jpg';
    }

    if (path.startsWith('http')) {
      return path;
    }

    if (path.startsWith('/')) {
      return `http://localhost:3000${path}`;
    }

    if (path.startsWith('img/')) {
      return `http://localhost:3000/${path}`;
    }

    return `http://localhost:3000/img/${path}`;
  }

  private emitirCambios(): void {
    this.productos.forEach((producto, index) => {
      this.calcularSubtotal(index);
    });

    this.productosSubject.next([...this.productos]);
    this.actualizarContadorInterno();
    this.guardarCarritoLocal();
  }

  private actualizarContadorInterno(): void {
    const total = this.obtenerCantidadTotal();
    this.carritoCountSubject.next(total);
    console.log(' Contador actualizado:', total);
  }

  private obtenerCantidadTotal(): number {
    return this.productos.reduce((acc, p) => acc + this.asegurarNumero(p.cantidad), 0);
  }

  recargarCarrito(): void {
    this.emitirCambios();
  }
  limpiarCarritoLocal(): void {
    console.log(' Limpiando carrito LOCAL (sin usuario)...');

    // 1. Limpiar array local
    this.productos = [];

    // 2. Limpiar localStorage del carrito
    localStorage.removeItem('carrito');

    // 3. Resetear contadores
    this.carritoCountSubject.next(0);
    this.productosSubject.next([]);

    console.log(' Carrito local limpiado completamente');
  }

  //  Método para limpiar carrito al logout
  limpiarCarritoLogout(): void {
    console.log(' Limpiando carrito por logout...');

    // Solo limpiar localmente, no tocar el backend
    this.limpiarCarritoLocal();
  }

  //  Método para verificar si hay usuario autenticado (público)
  estaAutenticadoPublico(): boolean {
    return this.estaAutenticado();
  }
}
