import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import Swal from 'sweetalert2';

//  IMPORTAR EL SERVICIO DE CLIENTES
import { ClientesService, RegistroRequest } from '../../enlace/clientes.service.ts';
import { CarritoService } from '../../enlace/carrito.service';
import { Usuarios, UsuarioData } from '../../servicios/usuarios';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css'],
})
export class Registro {
  registroForm: FormGroup;
  private auth = getAuth();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clientesService: ClientesService,
    private carritoService: CarritoService,
    private usuarios: Usuarios
  ) {
    this.registroForm = this.fb.group(
      {
        nombre: [
          '',
          [
            Validators.required,
            Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$'),
            Validators.minLength(3),
            Validators.maxLength(50),
          ],
        ],
        apellido: [
          '',
          [
            Validators.required,
            Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$'),
            Validators.minLength(3),
            Validators.maxLength(50),
          ],
        ],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
          ],
        ],
        telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
        direccion: ['', [Validators.maxLength(120)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            
            Validators.pattern('^(?=.*[a-zA-Z])(?=.*\\d)[a-zA-Z\\d\\W_]{6,}$'),
          ],
        ],
        confirmPassword: ['', Validators.required],
        terminos: [false, Validators.requiredTrue],
      },
      {
        validators: [this.passwordMatchValidator],
      }
    );
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registroForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo es obligatorio';

    switch (fieldName) {
      case 'nombre':
        if (errors['pattern']) return 'Solo se permiten letras y espacios';
        if (errors['minlength']) return 'El nombre debe tener al menos 3 caracteres';
        if (errors['maxlength']) return 'El nombre no puede tener más de 50 caracteres';
        break;

      case 'apellido':
        if (errors['pattern']) return 'Solo se permiten letras y espacios';
        if (errors['minlength']) return 'El apellido debe tener al menos 3 caracteres';
        if (errors['maxlength']) return 'El apellido no puede tener más de 50 caracteres';
        break;

      case 'email':
        if (errors['email'] || errors['pattern']) return 'Ingrese un correo electrónico válido';
        break;

      case 'telefono':
        if (errors['pattern']) return 'El teléfono debe tener 10 dígitos numéricos';
        break;

      case 'direccion':
        if (errors['maxlength']) return 'La dirección no puede tener más de 120 caracteres';
        break;

      case 'password':
        if (errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres';
        if (errors['pattern'])
          return 'La contraseña debe incluir letras y números (símbolos opcionales)';
        break;

      case 'confirmPassword':
        if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';
        break;
    }

    return 'Campo inválido';
  }

  async onRegistro() {
    if (this.registroForm.invalid) {
      Object.values(this.registroForm.controls).forEach((control) => {
        control.markAsTouched();
      });
      return;
    }

    try {
      const { email, password, nombre, apellido, telefono, direccion } = this.registroForm.value;

      //  PRIMERO INTENTAR REGISTRO EN BACKEND PROPIO
      const registroData: RegistroRequest = {
        nombre,
        apellido,
        correo: email,
        contraseña: password,
        telefono,
        direccion: direccion || '',
      };

      this.clientesService.registrar(registroData).subscribe({
        next: async (response) => {
          console.log(' Registro exitoso en backend:', response);

          localStorage.setItem('token', response.token);

          const userData: UsuarioData = {
            nombre: response.cliente.nombre,
            email: response.cliente.correo,
            foto: response.cliente.avatar_url || null,
            id: response.cliente.id_cliente.toString(),
            provider: 'local',
          };

          this.usuarios.setUser(userData);
          this.carritoService.afterLoginSincronizacion();

          Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Tu cuenta ha sido creada correctamente',
            timer: 2000,
            showConfirmButton: false,
          });

          await this.router.navigate(['/home']);
        },
        error: async (error) => {
          console.error(' Error en registro con backend:', error);
          await this.registroConFirebase(email, password, nombre, telefono);
        },
      });
    } catch (error) {
      console.error('Error en registro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error durante el registro',
      });
    }
  }

  private async registroConFirebase(
    email: string,
    password: string,
    nombre: string,
    telefono: string
  ) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      console.log(' Usuario registrado en Firebase:', user);

      const userData: UsuarioData = {
        nombre: nombre,
        email: user.email || email,
        foto: user.photoURL || null,
        id: user.uid,
        provider: 'password',
      };

      this.usuarios.setUser(userData);

      Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: 'Tu cuenta ha sido creada con Firebase',
        timer: 2000,
        showConfirmButton: false,
      });

      await this.router.navigate(['/home']);
    } catch (error: any) {
      console.error(' Error al registrar con Firebase:', error);
      let errorMessage = 'Error al crear la cuenta';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo ya está registrado';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  }
}
