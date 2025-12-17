import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  private url = 'http://localhost:3001/api/chat'; 

  constructor(private http: HttpClient) {}

  enviarMensaje(message: string): Observable<any> {
    return this.http.post(this.url, { message });
  }
}
