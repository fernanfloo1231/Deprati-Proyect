import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../servicios/chatbot';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css'],
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: { from: 'user' | 'bot'; text: string }[] = [];
  botones: { label: string; action: string }[] = [];
  userMessage: string = '';

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    this.mensajeBot('¡Hola! Bienvenido a DePrati. ¿Qué deseas hacer hoy?');
    this.botones = [
      { label: 'Ver categorías', action: 'categorias' },
      { label: 'Promociones', action: 'promociones' },
    ];
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  mensajeBot(text: string) {
    this.messages.push({ from: 'bot', text });
  }

  enviar() {
    if (!this.userMessage.trim()) return;

    const mensaje = this.userMessage;
    this.messages.push({ from: 'user', text: mensaje });
    this.userMessage = '';

    // LLAMADA AL API REAL
    this.chatbotService.enviarMensaje(mensaje).subscribe({
      next: (res) => {
        this.messages.push({
          from: 'bot',
          text: res.reply || '🤖 No se recibió respuesta del servidor.',
        });
      },
      error: () => {
        this.messages.push({ from: 'bot', text: '⚠ Error al conectar con el servidor.' });
      },
    });
  }

  accionBoton(boton: { label: string; action: string }) {
    this.messages.push({ from: 'user', text: boton.label });
    this.botones = [];

    switch (boton.action) {
      case 'categorias':
        this.mensajeBot('¡Perfecto! Selecciona una categoría:');
        this.botones = [
          { label: 'Hombre', action: 'Hombre' },
          { label: 'Mujer', action: 'Mujer' },
          { label: 'Tecnología', action: 'Tecnologia' },
          { label: 'Hogar', action: 'Hogar' },
          { label: 'Belleza', action: 'Belleza' },
        ];
        break;

      case 'promociones':
        this.mensajeBot('Actualmente tenemos descuentos especiales. Selecciona una categoría:');
        this.botones = [
          { label: 'Hombre', action: 'Hombre' },
          { label: 'Mujer', action: 'Mujer' },
          { label: 'Tecnología', action: 'Tecnologia' },
          { label: 'Hogar', action: 'Hogar' },
          { label: 'Belleza', action: 'Belleza' },
        ];
        break;

      default:
       
        this.chatbotService.enviarMensaje(`Mostrar producto de ${boton.action}`).subscribe({
          next: (res) => {
            this.messages.push({ from: 'bot', text: res.reply });
          },
          error: () => {
            this.messages.push({
              from: 'bot',
              text: ' No se pudo obtener información del servidor.',
            });
          },
        });
        break;
    }
  }
}
