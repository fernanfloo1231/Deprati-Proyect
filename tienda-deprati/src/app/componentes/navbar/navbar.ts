// En navbar.component.ts
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Usuarios, UsuarioData } from '../../servicios/usuarios';
import { AuthService } from '../../servicios/admin';
import { CarritoService } from '../../enlace/carrito.service';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Theme } from '../../servicios/theme';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent {
  user: UsuarioData | null = null;
  carritoCount = 0;
  searchQuery: string = '';

  //  Subject para búsqueda en tiempo real
  private searchSubject = new Subject<string>();

  constructor(
    private readonly router: Router,
    private readonly Usuarios: Usuarios,
    private carritoService: CarritoService,
    private authService: AuthService,
    private theme: Theme
  ) {
    //  Usuario
    this.Usuarios.currentUser$.subscribe((u) => {
      console.log('👤 Usuario en navbar:', u);
      this.user = u;
    });

    //  Carrito
    this.carritoService.carritoCount$.subscribe((c) => {
      console.log('🛒 Contador en navbar:', c);
      this.carritoCount = c;
    });

    //  Búsqueda en tiempo real corregida
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((query) => {
      query = query.trim();

      if (!query) return; // ⬅ evita navegar si está vacío

      this.router.navigate(['/buscar'], { queryParams: { query } });
    });
  }

  //  se ejecuta al escribir
  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  //  búsqueda al presionar Enter
  buscar() {
    let query = this.searchQuery.trim(); // corregido: ahora es let

    if (query.length === 0) return;

    this.router.navigate(['/buscar'], { queryParams: { query } });
  }
toggleTheme(): void {
  this.theme.toggleTheme();
}

  async logout() {
    console.log(' Ejecutando logout desde navbar...');

    try {
      this.carritoService.limpiarCarritoLogout();
      this.Usuarios.clearUser();
      this.authService.logoutCompleto();

      localStorage.removeItem('token');
      localStorage.removeItem('cliente_token');
      localStorage.removeItem('user');

      this.mostrarMensajeLogout();

      await this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }

  private mostrarMensajeLogout() {
    const mensajeElement = document.createElement('div');
    mensajeElement.textContent = 'Sesión cerrada correctamente';
    mensajeElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
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
}
