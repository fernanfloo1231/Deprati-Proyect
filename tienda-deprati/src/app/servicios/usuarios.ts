import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UsuarioData {
  nombre?: string | null;
  email?: string | null;
  foto?: string | null;
  id?: string | null;
  provider?: string | null;
  telefono?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class Usuarios {
  private userKey = 'userData';
  private _currentUser = new BehaviorSubject<UsuarioData | null>(null);

  constructor() {
    // Inicializar desde localStorage si existe
    try {
      const raw = localStorage.getItem(this.userKey);
      if (raw) {
        this._currentUser.next(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('No se pudo parsear userData desde localStorage', e);
    }
  }

  get currentUser$(): Observable<UsuarioData | null> {
    return this._currentUser.asObservable();
  }

  getCurrentUserSync(): UsuarioData | null {
    return this._currentUser.getValue();
  }

  setUser(user: UsuarioData) {
    this._currentUser.next(user);
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (e) {
      console.warn('No se pudo guardar userData en localStorage', e);
    }
  }

  clearUser() {
    this._currentUser.next(null);
    try {
      localStorage.removeItem(this.userKey);
    } catch (e) {
      console.warn('No se pudo eliminar userData de localStorage', e);
    }
  }
}
