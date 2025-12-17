import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Usuarios } from '../../servicios/usuarios';
import { AuthService } from '../../servicios/admin';
import { ProductoService, Producto as ProductoBD } from '../../enlace/producto';
import { PedidoAdminService } from '../../enlace/pedido-admin.service';
import Swal from 'sweetalert2';
import { Chart } from 'chart.js/auto';
import { EstadisticasAdminService } from '../../enlace/estadisticas-admin';

type ProductoLocal = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url?: string;
  descuento?: number;
  stock: number;
  marca?: string;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class Admin implements OnInit {
  private ventasChart?: Chart;
  private productosChart?: Chart;

  userField = '';
  passField = '';
  loggedIn = false;
  activeTab: 'productos' | 'pedidos' | 'estadisticas' = 'productos';

  productos: ProductoLocal[] = [];
  form: Partial<
    ProductoLocal & {
      cantidad?: number;
      imagenNombre?: string;
      imagenPreview?: string;
      imagenFile?: File;
    }
  > = {};
  editingIndex: number | null = null;
  pedidos: any[] = [];
  selectedPedidoIndex: number | null = null;
  categorias: string[] = ['Mujeres', 'Hombres', 'Belleza', 'Hogar', 'Tecnologia', 'Ofertas'];

  constructor(
    private readonly usuarios: Usuarios,
    private authService: AuthService,
    private router: Router,
    private productoService: ProductoService,
    private pedidoAdminService: PedidoAdminService,

    private estadisticasService: EstadisticasAdminService
  ) {}

  cambiarTab(tab: 'productos' | 'pedidos' | 'estadisticas') {
    this.activeTab = tab;

    if (tab === 'estadisticas') {
      // Esperar a que el HTML renderice los canvas
      setTimeout(() => {
        this.cargarEstadisticas();
      }, 0);
    }
  }

  ngOnInit(): void {
    this.loadProductos();
    this.loadPedidos();

    // Verificar si ya está logueado como admin
    const u = this.usuarios.getCurrentUserSync?.();
    if (u && u.provider === 'admin') {
      this.loggedIn = true;
    }

    // También verificar con el nuevo AuthService
    if (this.authService.isAdminUser()) {
      this.loggedIn = true;
    }
  }

  private loadPedidos() {
    this.pedidoAdminService.getPedidos().subscribe({
      next: (res) => {
        console.log(' Pedidos cargados desde backend:', res);
        this.pedidos = res.pedidos;
      },
      error: (err) => {
        console.error(' Error cargando pedidos desde backend:', err);
        alert('Error al cargar pedidos');
      },
    });
  }

  login() {
    const usuarioTrim = (this.userField || '').trim();
    const passTrim = (this.passField || '').trim();

    if (!usuarioTrim || !passTrim) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Usuario y contraseña son requeridos.',
      });
      return;
    }

    this.authService.login(usuarioTrim, passTrim).subscribe({
      next: (response) => {
        this.loggedIn = true;
        this.authService.setAdminMode(true);

        this.usuarios.setUser({
          nombre: response.admin.usuario,
          id: response.admin.id_admin.toString(),
          provider: 'admin',
          email: response.admin.usuario,
        });

        this.userField = '';
        this.passField = '';

        Swal.fire({
          icon: 'success',
          title: 'Bienvenido',
          text: 'Inicio de sesión exitoso.',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        let errorMsg = 'Error en el login';
        if (err.status === 401) errorMsg = 'Usuario o contraseña incorrectos';
        if (err.status === 404) errorMsg = 'Servicio no disponible';
        if (err.error?.error) errorMsg = err.error.error;

        Swal.fire({
          icon: 'error',
          title: 'No se pudo iniciar sesión',
          text: errorMsg,
        });
      },
    });
  }

  logout() {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Tu sesión de administrador será cerrada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loggedIn = false;
        this.usuarios.clearUser();
        this.authService.logoutCompleto();
        this.router.navigate(['/home']);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Sesión cerrada',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }

  private mostrarMensajeLogout() {
    const mensajeElement = document.createElement('div');
    mensajeElement.textContent = 'Sesión de administrador cerrada';
    mensajeElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff9800;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
    `;
    document.body.appendChild(mensajeElement);

    setTimeout(() => {
      if (document.body.contains(mensajeElement)) {
        document.body.removeChild(mensajeElement);
      }
    }, 3000);
  }

  // Para poder usar authService en el template
  get auth() {
    return this.authService;
  }

  private loadProductos() {
    console.log('🔄 Cargando productos desde la base de datos...');

    this.productoService.getProductos().subscribe({
      next: (productosBD: ProductoBD[]) => {
        console.log(' Productos cargados desde BD:', productosBD);
        this.productos = productosBD.map((p) => this.convertirProductoBDaLocal(p));
        console.log(' Productos convertidos:', this.productos);
      },
      error: (err) => {
        console.error(' Error cargando productos desde BD:', err);
        // Fallback a localStorage
        try {
          const raw = localStorage.getItem('productos');
          this.productos = raw ? JSON.parse(raw) : [];
          console.warn(' Usando productos de localStorage como fallback');
        } catch (e) {
          console.warn('No se pudo cargar productos', e);
          this.productos = [];
        }
      },
    });
  }

  private saveProductos() {
    try {
      localStorage.setItem('productos', JSON.stringify(this.productos));
      console.log(' Backup guardado en localStorage');
    } catch (e) {
      console.warn('No se pudo guardar backup en localStorage', e);
    }
  }

  onImageSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    console.log(' Archivo seleccionado:', {
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size,
    });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      alert(`Formato no permitido: ${file.type}. Use: JPEG, PNG, GIF, WEBP`);
      input.value = '';
      return;
    }

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.');
      input.value = '';
      return;
    }

    this.form.imagenFile = file;
    this.form.imagenNombre = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.form.imagenPreview = reader.result as string;
      console.log(' Vista previa creada correctamente');
    };
    reader.onerror = (error) => {
      console.error(' Error leyendo archivo:', error);
      alert('Error al procesar la imagen');
    };
    reader.readAsDataURL(file);
  }

  addOrUpdateProducto() {
    // Si existe una imagen para subir
    if (this.form.imagenFile) {
      console.log('Subiendo imagen:', this.form.imagenFile.name);

      this.productoService.subirImagen(this.form.imagenFile).subscribe({
        next: (response) => {
          console.log(' Imagen subida:', response);

          const imagenUrl = response.url || `img/${response.filename}`;
          this.guardarProductoConImagen(imagenUrl);
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error al subir imagen',
            text: 'No se pudo subir la imagen. Intenta nuevamente.',
          });
        },
      });
    }

    // Si NO se sube una imagen nueva
    else {
      const imagenUrl = this.form.imagen_url || 'img/imagenplaceholder.jpg';
      this.guardarProductoConImagen(imagenUrl);
    }
  }

  private guardarProductoConImagen(imagenUrl: string) {
    //  Validación: categoría obligatoria
    if (!this.form.categoria) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta la categoría',
        text: 'Debes seleccionar una categoría antes de guardar.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    // Datos para enviar a la BD
    const productoData: any = {
      nombre: String(this.form.nombre || ''),
      descripcion: String(this.form.descripcion || ''),
      precio_normal: Number(this.form.precio) || 0,
      stock: Number(this.form.stock) || 0,
      id_categoria: this.getCategoriaId(this.form.categoria),
      marca: String(this.form.marca || ''),
      imagen_url: imagenUrl,
    };

    // Precio de oferta si aplica
    if (this.form.descuento && this.form.descuento > 0) {
      productoData.precio_oferta = Number(this.form.precio) * (1 - this.form.descuento / 100);
    }

    console.log(' Guardando producto en BD:', productoData);

    // CREAR PRODUCTO

    if (this.editingIndex == null) {
      this.productoService.addProducto(productoData).subscribe({
        next: (response) => {
          console.log(' Producto creado en BD:', response);

          Swal.fire({
            icon: 'success',
            title: 'Producto creado',
            text: 'El producto fue registrado exitosamente.',
            timer: 1500,
            showConfirmButton: false,
          });

          this.loadProductos();
          this.form = {};
        },
        error: (err) => {
          console.error(' Error creando producto:', err);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo crear el producto',
            text: err.error?.message || 'Ocurrió un error al guardar en la base de datos.',
          });
        },
      });

      // ACTUALIZAR PRODUCTO
    } else {
      const productoId = this.productos[this.editingIndex].id;
      const idNumerico = this.extractId(productoId);

      this.productoService.updateProducto(idNumerico, productoData).subscribe({
        next: (response) => {
          console.log('✅ Producto actualizado:', response);

          Swal.fire({
            icon: 'success',
            title: 'Producto actualizado',
            text: 'Los cambios fueron guardados correctamente.',
            timer: 1500,
            showConfirmButton: false,
          });

          this.loadProductos();
          this.form = {};
          this.editingIndex = null;
        },
        error: (err) => {
          console.error(' ERROR ACTUALIZANDO PRODUCTO:', err);

          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar',
            text: err.error?.message || 'Ocurrió un error actualizando el producto.',
          });
        },
      });
    }
  }

  cargarEstadisticas() {
    //VENTAS POR DÍA
    this.estadisticasService.getVentas().subscribe((res) => {
      const data = res.data ?? [];
      if (!data.length) return;

      const labels = data.map((d: any) => new Date(d.fecha).toLocaleDateString());
      const values = data.map((d: any) => Number(d.total_ventas));

      this.ventasChart?.destroy();

      this.ventasChart = new Chart('ventasChart', {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Ventas ($)',
              data: values,
              fill: true,
              borderWidth: 3,
              borderColor: '#00b4d8',
              backgroundColor: (ctx) => {
                const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                g.addColorStop(0, 'rgba(0,180,216,0.35)');
                g.addColorStop(1, 'rgba(0,180,216,0)');
                return g;
              },
              pointRadius: 5,
              pointHoverRadius: 8,
              pointBackgroundColor: '#00b4d8',
              tension: 0.45,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              labels: {
                color: '#cfd8dc',
                font: { weight: 600 },
              },
            },
            tooltip: {
              backgroundColor: '#0e1117',
              titleColor: '#90e0ef',
              bodyColor: '#ffffff',
              borderColor: '#00b4d8',
              borderWidth: 1,
              padding: 12,
            },
          },
          scales: {
            x: {
              ticks: { color: '#9aa0a6' },
              grid: { display: false },
            },
            y: {
              ticks: { color: '#9aa0a6' },
              grid: {
                color: 'rgba(255,255,255,0.05)',
              },
            },
          },
        },
      });
    });

    //TOP PRODUCTOS
    this.estadisticasService.getTopProductos().subscribe((res) => {
      const data = res.data ?? [];
      if (!data.length) return;

      const labels = data.map((d: any) => d.nombre);
      const values = data.map((d: any) => Number(d.total_vendido));

      this.productosChart?.destroy();

      this.productosChart = new Chart('productosChart', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Unidades vendidas',
              data: values,
              borderRadius: 12,
              backgroundColor: (ctx) => {
                const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                g.addColorStop(0, '#00b4d8');
                g.addColorStop(1, '#023e8a');
                return g;
              },
              hoverBackgroundColor: '#90e0ef',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1200,
            easing: 'easeOutCubic',
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0e1117',
              titleColor: '#90e0ef',
              bodyColor: '#ffffff',
              borderColor: '#00b4d8',
              borderWidth: 1,
              padding: 12,
            },
          },
          scales: {
            x: {
              ticks: { color: '#cfd8dc' },
              grid: { display: false },
            },
            y: {
              ticks: { color: '#cfd8dc' },
              grid: {
                color: 'rgba(255,255,255,0.05)',
              },
            },
          },
        },
      });
    });
  }

  abrirEstadisticas() {
    this.activeTab = 'estadisticas';

    // Espera a que el DOM pinte los canvas
    setTimeout(() => {
      this.cargarEstadisticas();
    }, 0);
  }

  editarProducto(i: number) {
    const p = this.productos[i];
    console.log(' Editando producto:', p);
    console.log(' imagen_url del producto:', p.imagen_url);
    let imagenNombre = '';
    if (p.imagen_url) {
      const urlParts = p.imagen_url.split('/');
      imagenNombre = urlParts[urlParts.length - 1];
    }
    const imagenPreview = this.getImagenUrl(p.imagen_url);

    this.form = {
      ...p,
      precio: p.precio,
      imagenNombre: imagenNombre,
      imagenPreview: imagenPreview,
    };
    this.editingIndex = i;
    this.activeTab = 'productos';

    console.log(' Form imagenPreview establecida:', this.form.imagenPreview);
  }

  eliminarProducto(i: number) {
    const producto = this.productos[i];

    Swal.fire({
      title: '¿Eliminar producto?',
      text: `Se eliminará: ${producto.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const idNumerico = this.extractId(producto.id);

      this.productoService.deleteProducto(idNumerico).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Producto eliminado',
            text: 'El producto fue eliminado correctamente',
            timer: 1500,
            showConfirmButton: false,
          });
          this.loadProductos();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo eliminar',
            text: 'Ocurrió un error eliminando el producto',
          });
        },
      });
    });
  }

  aplicarDescuento(i: number, percent: number) {
    const p = this.productos[i];
    p.descuento = percent;
    this.saveProductos();
  }

  precioConDescuento(p: ProductoLocal) {
    if (!p.descuento) return p.precio;
    return +(p.precio * (1 - (p.descuento || 0) / 100)).toFixed(2);
  }

  seleccionarPedido(i: number) {
    this.selectedPedidoIndex = i;
  }

  actualizarEstadoPedido(estado: string) {
    if (this.selectedPedidoIndex === null) return;

    const pedido = this.pedidos[this.selectedPedidoIndex];

    Swal.fire({
      title: '¿Confirmar cambio de estado?',
      text: `El pedido #${pedido.id_pedido} cambiará a: ${estado}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.pedidoAdminService.actualizarEstado(pedido.id_pedido, estado).subscribe({
        next: () => {
          pedido.estado = estado;

          Swal.fire({
            icon: 'success',
            title: 'Estado actualizado',
            text: `El pedido ahora está en estado: ${estado}`,
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error(' Error actualizando estado:', err);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo actualizar',
            text: 'Ocurrió un error al actualizar el estado del pedido.',
          });
        },
      });
    });
  }

  // Método auxiliar para extraer ID numérico
  private extractId(productoId: string): number {
    console.log(' Extrayendo ID de:', productoId);

    // Remover "PR-" si existe
    const idStr = productoId.replace('PR-', '');
    const numericId = parseInt(idStr, 10);

    // Si el ID es demasiado grande para INTEGER, usar uno pequeño
    if (numericId > 2147483647) {
      console.warn(' ID demasiado grande, usando ID temporal');
      return Math.floor(Math.random() * 10000) + 1;
    }

    console.log(' ID extraído:', numericId);
    return numericId;
  }

  // Método para mapear categorías a IDs (necesitas implementar según tu BD)
  private getCategoriaId(categoriaNombre: string): number {
    const categoriasMap: { [key: string]: number } = {
      Mujeres: 1,
      Hombres: 2,
      Belleza: 3,
      Hogar: 4,
      Tecnologia: 5,
      Ofertas: 6,
    };
    return categoriasMap[categoriaNombre] || 1;
  }
  getImagenUrl(imagenPath: any): string {
    console.log(' getImagenUrl recibió:', typeof imagenPath, imagenPath);

    if (!imagenPath) {
      console.log(' imagenPath está vacío, usando placeholder');
      return 'img/imagenplaceholder.jpg';
    }

    const path = String(imagenPath).trim();

    if (path === '') {
      console.log(' path está vacío después de trim');
      return 'img/imagenplaceholder.jpg';
    }

    // DETECTAR SI ES UN DATA URL
    if (path.startsWith('data:')) {
      console.log(' Es data URL, usar directamente');
      return path;
    }

    // DETECTAR SI YA ES URL COMPLETA
    if (path.startsWith('http')) {
      console.log(' Ya es URL completa');
      return path;
    }

    // PARA RUTAS RELATIVAS
    if (path.startsWith('/')) {
      const finalUrl = `http://localhost:3000${path}`;
      console.log(' URL construida con /:', finalUrl);
      return finalUrl;
    }

    // PARA RUTAS CON img/
    if (path.startsWith('img/')) {
      const finalUrl = `http://localhost:3000/${path}`;
      console.log(' URL construida con img/:', finalUrl);
      return finalUrl;
    }

    // PARA NOMBRES SIMPLES DE ARCHIVO
    const finalUrl = `http://localhost:3000/img/${path}`;
    console.log(' URL construida normal:', finalUrl);
    return finalUrl;
  }

  onImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    console.warn(' Admin - Error cargando imagen, usando placeholder');
    imgElement.src = 'img/imagenplaceholder.jpg';
    imgElement.onerror = null;
  }

  private convertirProductoBDaLocal(productoBD: ProductoBD): ProductoLocal {
    console.log(' Convirtiendo producto BD:', productoBD);

    // Calcular descuento si existe precio_oferta
    let descuento = 0;
    if (productoBD.precio_oferta && productoBD.precio_oferta > 0 && productoBD.precio_normal > 0) {
      descuento = Math.round(
        ((productoBD.precio_normal - productoBD.precio_oferta) / productoBD.precio_normal) * 100
      );
    }

    // Obtener categoría (puede venir como id_categoria o categoria_nombre)
    let categoria = 'General';
    if (productoBD.categoria_nombre) {
      categoria = productoBD.categoria_nombre;
    } else if (productoBD.id_categoria) {
      categoria = this.getCategoriaNombre(productoBD.id_categoria);
    }

    return {
      id: productoBD.id_producto?.toString() || 'sin-id',
      nombre: productoBD.nombre || '',
      descripcion: productoBD.descripcion || '',
      precio: productoBD.precio_normal || 0,
      categoria: categoria,
      imagen_url: productoBD.imagen_url,
      descuento: descuento,
      stock: productoBD.stock || 0,
      marca: productoBD.marca || '',
    };
  }

  private getCategoriaNombre(idCategoria: number): string {
    const categoriasMap: { [key: number]: string } = {
      1: 'Mujeres',
      2: 'Hombres',
      3: 'Belleza',
      4: 'Hogar',
      5: 'Tecnologia',
      6: 'Ofertas',
    };
    return categoriasMap[idCategoria] || 'General';
  }
}
