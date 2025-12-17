import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Admin {
  id_admin?: number;
  usuario: string;
  rol: string;
  fecha_creacion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/admin';
  private isAdmin = false;
  private currentAdmin: Admin | null = null;

  constructor(private http: HttpClient) {}

  login(usuario: string, contraseña: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { usuario, contraseña }).pipe(
      tap((response) => {
        if (response.admin) {
          this.isAdmin = true;
          this.currentAdmin = response.admin;
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('adminData', JSON.stringify(response.admin));
        }
      })
    );
  }

  setAdminMode(isAdmin: boolean) {
    this.isAdmin = isAdmin;
    localStorage.setItem('isAdmin', JSON.stringify(isAdmin));
  }

  isAdminUser(): boolean {
    // Verifica tanto el servicio como localStorage
    const stored = localStorage.getItem('isAdmin');
    const adminData = localStorage.getItem('adminData');

    if (adminData) {
      this.currentAdmin = JSON.parse(adminData);
    }

    return this.isAdmin || (stored ? JSON.parse(stored) : false);
  }

  getCurrentAdmin(): Admin | null {
    return this.currentAdmin;
  }

  logoutCompleto() {
    this.isAdmin = false;
    this.currentAdmin = null;

    // Limpiar TODOS los datos de localStorage relacionados con auth
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminData');
    localStorage.removeItem('userData'); // ← También limpia datos de usuario normal

    console.log(' Logout completo realizado');
  }

  // Mantener el logout original para compatibilidad
  logout() {
    this.logoutCompleto();
  }
}
