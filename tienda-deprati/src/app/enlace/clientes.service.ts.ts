import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  direccion?: string;
  fecha_registro: string;
  avatar_url?: string;
  provider: 'local' | 'google' | 'facebook';
}

export interface LoginRequest {
  correo: string;
  contraseña: string;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  correo: string;
  contraseña: string;
  telefono?: string;
  direccion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private apiUrl = 'http://localhost:3000/clientes';
  private currentUserSubject = new BehaviorSubject<Cliente | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  login(
    credenciales: LoginRequest
  ): Observable<{ message: string; cliente: Cliente; token: string }> {
    return this.http
      .post<{ message: string; cliente: Cliente; token: string }>(
        `${this.apiUrl}/login`,
        credenciales
      )
      .pipe(tap((response) => this.setUser(response.cliente, response.token)));
  }

  //  REGISTRO CON BACKEND PROPIO
  registrar(
    clienteData: RegistroRequest
  ): Observable<{ message: string; cliente: Cliente; token: string }> {
    return this.http
      .post<{ message: string; cliente: Cliente; token: string }>(
        `${this.apiUrl}/registrar`,
        clienteData
      )
      .pipe(tap((response) => this.setUser(response.cliente, response.token)));
  }

  //  LOGIN SOCIAL CON BACKEND PROPIO
  loginSocial(provider: 'google' | 'facebook'): void {
    window.location.href = `${this.apiUrl}/${provider}`;
  }

  //  OBTENER PERFIL
  obtenerPerfil(): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/perfil`);
  }

  //  ACTUALIZAR PERFIL
  actualizarPerfil(
    perfilData: Partial<Cliente>
  ): Observable<{ message: string; cliente: Cliente }> {
    return this.http
      .put<{ message: string; cliente: Cliente }>(`${this.apiUrl}/perfil`, perfilData)
      .pipe(tap((response) => this.updateCurrentUser(response.cliente)));
  }

  //  LOGOUT
  logout(): void {
    localStorage.removeItem('cliente_token');
    localStorage.removeItem('cliente_data');
    this.currentUserSubject.next(null);
  }

  //  VERIFICAR SI ESTÁ AUTENTICADO COMO CLIENTE
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  //  OBTENER TOKEN
  getToken(): string | null {
    return localStorage.getItem('cliente_token');
  }

  //  CARGAR USUARIO DESDE LOCALSTORAGE
  private loadUserFromStorage(): void {
    const token = localStorage.getItem('cliente_token');
    const userStr = localStorage.getItem('cliente_data');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  //  GUARDAR USUARIO
  private setUser(cliente: Cliente, token: string): void {
    localStorage.setItem('cliente_token', token);
    localStorage.setItem('cliente_data', JSON.stringify(cliente));
    this.currentUserSubject.next(cliente);
  }

  //  ACTUALIZAR USUARIO ACTUAL
  private updateCurrentUser(cliente: Cliente): void {
    localStorage.setItem('cliente_data', JSON.stringify(cliente));
    this.currentUserSubject.next(cliente);
  }

  //  OBTENER USUARIO ACTUAL (sincrónico)
  getCurrentUser(): Cliente | null {
    return this.currentUserSubject.value;
  }
}
