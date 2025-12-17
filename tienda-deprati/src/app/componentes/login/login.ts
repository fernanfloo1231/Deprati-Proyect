import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Usuarios, UsuarioData } from '../../servicios/usuarios';
import { CommonModule } from '@angular/common';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import Swal from 'sweetalert2';
import { ClientesService, LoginRequest } from '../../enlace/clientes.service.ts';
import { CarritoService } from '../../enlace/carrito.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  private readonly auth = getAuth();

  constructor(
    private readonly router: Router,
    private readonly usuarios: Usuarios,
    private clientesService: ClientesService,
    private carritoService: CarritoService
  ) {}

  async onLogin(form: NgForm) {
    const emailTrim = (this.email || '').trim();
    const passwordVal = this.password || '';

    // ✅ PRIMERO VERIFICAR SI ES ADMIN
    if (emailTrim === 'admin123@gmail.com' && passwordVal === 'Admin123*') {
      const userData: UsuarioData = {
        nombre: 'admin',
        email: 'admin123@gmail.com',
        foto: null,
        id: 'admin',
        provider: 'admin',
      };
      this.usuarios.setUser(userData);
      await this.router.navigate(['/home']);
      return;
    }

    // ✅ VALIDACIÓN MÁS FLEXIBLE PARA USUARIOS NORMALES
    if (!emailTrim || !passwordVal) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Email y contraseña son obligatorios',
      });
      return;
    }

    if (!this.isValidEmail(emailTrim)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor ingresa un email válido',
      });
      return;
    }

    // ✅ 1. INTENTAR LOGIN CON BACKEND PROPIO (CLIENTE)
    try {
      const credenciales: LoginRequest = {
        correo: emailTrim,
        contraseña: passwordVal,
      };

      this.clientesService.login(credenciales).subscribe({
        next: async (response) => {
          console.log('✅ Login exitoso con backend:', response);

          localStorage.setItem('token', response.token);

          const userData: UsuarioData = {
            nombre: response.cliente.nombre,
            email: response.cliente.correo,
            foto: response.cliente.avatar_url || null,
            id: response.cliente.id_cliente.toString(),
            provider: 'local',
          };

          this.usuarios.setUser(userData);

          // ✅ SINCRONIZAR CARRITO DESPUÉS DEL LOGIN
          this.carritoService.afterLoginSincronizacion();

          Swal.fire({
            icon: 'success',
            title: '¡Bienvenido!',
            text: response.message || 'Inicio de sesión exitoso',
            timer: 1500,
            showConfirmButton: false,
          });

          await this.router.navigate(['/home']);
        },
        error: async (error) => {
          console.log('❌ Backend propio falló, intentando con Firebase...', error);
          await this.loginWithFirebase(emailTrim, passwordVal);
        },
      });
    } catch (error) {
      console.error('Error en login:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error durante el inicio de sesión',
      });
    }
  }

  // ✅ MÉTODO PARA VALIDAR EMAIL
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // ✅ MÉTODO PARA LOGIN CON FIREBASE (como fallback)
  private async loginWithFirebase(email: string, password: string) {
    try {
      const { user } = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Login exitoso con Firebase:', user);

      const userData: UsuarioData = {
        nombre: user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: user.email || email,
        foto: user.photoURL || null,
        id: user.uid,
        provider: 'password',
      };

      this.usuarios.setUser(userData);

      // ✅ SINCRONIZAR CARRITO DESPUÉS DEL LOGIN CON FIREBASE
      this.carritoService.afterLoginSincronizacion();

      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Inicio de sesión exitoso',
        timer: 1500,
        showConfirmButton: false,
      });

      await this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión con Firebase:', error);
      let errorMessage = 'Error al iniciar sesión';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales inválidas';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  }

  // ✅ LOGIN CON GOOGLE MEJORADO
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(this.auth, provider);

      const user = result.user;
      const userData: UsuarioData = {
        nombre: user.displayName || null,
        email: user.email || null,
        foto: user.photoURL || null,
        id: user.uid || null,
        provider: 'google',
      };

      this.usuarios.setUser(userData);
      console.log('✅ Inicio de sesión con Google exitoso:', userData);

      // ✅ REDIRIGIR AL BACKEND PARA REGISTRO/LOGIN SOCIAL
      window.open('http://localhost:3000/clientes/google', '_self');
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión con Google:', error);
      let errorMessage = 'Error al iniciar sesión con Google';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Ventana de inicio de sesión cerrada';
          break;
        case 'auth/popup-blocked':
          errorMessage =
            'El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'La operación fue cancelada. Por favor, intenta nuevamente.';
          break;
        case 'auth/operation-not-supported-in-this-environment':
          errorMessage = 'El inicio de sesión con Google no está disponible en este navegador.';
          break;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  }

  // ✅ LOGIN CON FACEBOOK MEJORADO
  async loginWithFacebook() {
    try {
      const provider = new FacebookAuthProvider();
      provider.setCustomParameters({
        display: 'popup',
      });

      const result = await signInWithPopup(this.auth, provider);

      const user = result.user;
      const userData: UsuarioData = {
        nombre: user.displayName || null,
        email: user.email || null,
        foto: user.photoURL || null,
        id: user.uid || null,
        provider: 'facebook',
      };

      this.usuarios.setUser(userData);
      console.log('✅ Inicio de sesión con Facebook exitoso:', userData);

      // Sin abrir la pestaña del backend: sincronizar carrito y navegar localmente a inicio
      this.carritoService.afterLoginSincronizacion();

      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Inicio de sesión exitoso',
        timer: 1500,
        showConfirmButton: false,
      });

      await this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión con Facebook:', error);
      let errorMessage = 'Error al iniciar sesión con Facebook';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Ventana de inicio de sesión cerrada';
          break;
        case 'auth/popup-blocked':
          errorMessage =
            'El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage =
            'Ya existe una cuenta con este email pero con otro método de inicio de sesión.';
          break;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  }

  // ✅ NUEVO MÉTODO PARA MANEJAR EL CALLBACK DEL LOGIN SOCIAL
  manejarCallbackSocial() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const cliente = urlParams.get('cliente');

    if (token && cliente) {
      try {
        localStorage.setItem('token', token);

        const clienteData = JSON.parse(decodeURIComponent(cliente));

        const userData: UsuarioData = {
          nombre: clienteData.nombre,
          email: clienteData.correo,
          foto: clienteData.avatar_url || null,
          id: clienteData.id_cliente.toString(),
          provider: clienteData.provider || 'google',
        };

        this.usuarios.setUser(userData);

        this.carritoService.afterLoginSincronizacion();

        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error procesando callback social:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al procesar el inicio de sesión',
        });
      }
    }
  }

  // ✅ ELIMINAMOS LA VALIDACIÓN DE PATRÓN PARA EL LOGIN
  isAdminAttempt(): boolean {
    return (this.email || '').trim() === 'admin123@gmail.com' && (this.password || '').length > 0;
  }

  ngOnInit() {
    this.manejarCallbackSocial();
  }
}
