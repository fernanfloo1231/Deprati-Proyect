import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Usuarios as UsuariosService, UsuarioData } from '../servicios/usuarios';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CarritoService } from '../enlace/carrito.service';

@Component({
  selector: 'app-validaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validaciones.html',
  styleUrls: ['./validaciones.css'],
})
export class Validaciones implements OnInit, OnDestroy {
  formulario: FormGroup;
  provincias: string[] = [];
  ciudades: string[] = [];

  mapaEcuador = {
    provincias: ['Pichincha', 'Guayas', 'Azuay', 'Manabí', 'Loja'],
    ciudades: {
      Pichincha: ['Quito', 'Cayambe', 'Sangolquí'],
      Guayas: ['Guayaquil', 'Daule', 'Samborondón'],
      Azuay: ['Cuenca', 'Gualaceo'],
      Manabí: ['Portoviejo', 'Manta'],
      Loja: ['Loja', 'Catamayo'],
    },
  };

  productos: any[] = [];
  total: number = 0;
  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private readonly usuariosService: UsuariosService,
    private readonly carrito: CarritoService,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      provincia: ['', Validators.required],
      ciudad: ['', Validators.required],
      codigoPostal: ['', Validators.required],
      direccionCompleta: ['', [Validators.required, Validators.minLength(10)]],
      metodoPago: ['', Validators.required],
      tarjetaNumero: [''],
      tarjetaExp: [''],
      tarjetaCvv: [''],
      cuentaBanco: [''],
      paypalEmail: [''],
      comentarios: [''],
    });
  }

  ngOnInit() {
    // Precargar datos del usuario si está logueado
    const s1 = this.usuariosService.currentUser$.subscribe((u: UsuarioData | null) => {
      if (u) {
        this.formulario.patchValue({
          nombre: u.nombre || '',
          email: u.email || '',
          telefono: u.telefono || '',
        });
      }
    });

    // Suscribirse al carrito
    const s2 = this.carrito.productos$.subscribe((list) => {
      this.productos = list || [];
      this.total = this.productos.reduce((acc, p) => acc + (p.precio || 0) * (p.cantidad || 0), 0);
    });

    this.subs.push(s1, s2);

    // precargar provincias
    this.provincias = this.mapaEcuador.provincias;
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  onProvinciaChange(event: Event) {
    const prov = (event.target as HTMLSelectElement).value;
    const ciudadesEcuador: Record<string, string[]> = this.mapaEcuador.ciudades;
    this.ciudades = ciudadesEcuador[prov] || [];
    this.formulario.patchValue({ ciudad: '' });
  }

  campoEsValido(campo: string): boolean {
    const field = this.formulario.get(campo);
    return !!field && field.invalid && field.touched;
  }

  enviarFormulario() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos requeridos.',
      });
      return;
    }

    Swal.fire({
      title: 'Procesando tu compra...',
      text: 'Por favor, espera unos segundos.',
      allowOutsideClick: false,
      timer: 3000,
      didOpen: () => {
        Swal.showLoading();
      },
      showConfirmButton: false,
    }).then(() => {
      const pedido = {
        id: 'PED-' + Date.now(),
        tracking: 'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        fecha: new Date().toLocaleString(),
        total: this.total,
        metodoPago: this.formulario.get('metodoPago')?.value,
        direccion: {
          pais: 'Ecuador',
          provincia: this.formulario.get('provincia')?.value,
          ciudad: this.formulario.get('ciudad')?.value,
          codigoPostal: this.formulario.get('codigoPostal')?.value,
          direccionCompleta: this.formulario.get('direccionCompleta')?.value,
        },
        productos: JSON.parse(JSON.stringify(this.productos)),
        usuarioEmail: this.formulario.get('email')?.value,
      };

      const pedidosGuardados = JSON.parse(localStorage.getItem('pedidos') || '[]');
      pedidosGuardados.push(pedido);
      localStorage.setItem('pedidos', JSON.stringify(pedidosGuardados));

      Swal.fire({
        icon: 'success',
        title: '¡Compra exitosa!',
        text: 'Tu pedido fue procesado correctamente.',
        confirmButtonColor: '#c91f27',
      }).then(() => {
        //this.carrito.limpiarCarrito();
        this.router.navigate(['/carrito']);
      });
    });
  }
}
