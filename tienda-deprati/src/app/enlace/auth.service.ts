import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  getToken(): string | null {
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token')
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any {
    // Retorna la información del usuario actual si la tienes
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  }

  // Método para simular si no tienes auth implementado
  getTokenSimulado(): string {
    return 'token-simulado-para-pruebas';
  }
}
