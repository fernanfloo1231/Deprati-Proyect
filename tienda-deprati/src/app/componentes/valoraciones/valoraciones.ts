import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-valoraciones',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor],
  templateUrl: './valoraciones.html',
  styleUrls: ['./valoraciones.css'],
})
export class Valoraciones {
  valoraciones = [
    {
      cliente: 'María López',
      producto: 'Smart TV Samsung 75"',
      estrellas: 5,
      comentario:
        'La calidad de imagen es impresionante. Los colores se ven vivos y el sonido es potente. ¡Totalmente recomendado!',
      fecha: '12/09/2025',
    },
    {
      cliente: 'Carlos Pérez',
      producto: 'Refrigeradora Mabe',
      estrellas: 4,
      comentario:
        'Muy buena capacidad y enfría rápido. Solo hace un poco de ruido a veces, pero cumple excelente.',
      fecha: '25/08/2025',
    },
    {
      cliente: 'Lucía Torres',
      producto: 'Celular Samsung A55',
      estrellas: 5,
      comentario:
        'Rápido, con buena cámara y pantalla brillante. La batería me dura todo el día, sin quejas.',
      fecha: '01/09/2025',
    },
    {
      cliente: 'Andrés Martínez',
      producto: 'LG UHD 75" AI',
      estrellas: 3,
      comentario:
        'Buena pantalla, pero el control remoto no me convence mucho. Aun así, buena relación calidad-precio.',
      fecha: '15/09/2025',
    },
  ];

  nuevaValoracion = { cliente: '', producto: '', estrellas: 0, comentario: '' };

  getStars(num: number) {
    return Array(num).fill(0);
  }
  getEmptyStars(num: number) {
    return Array(5 - num).fill(0);
  }

  agregarValoracion() {
    if (
      !this.nuevaValoracion.cliente.trim() ||
      !this.nuevaValoracion.producto.trim() ||
      this.nuevaValoracion.estrellas === 0 ||
      !this.nuevaValoracion.comentario.trim()
    ) {
      alert('Por favor, completa todos los campos antes de enviar tu valoración.');
      return;
    }

    const hoy = new Date();
    const fecha = hoy.toLocaleDateString();

    this.valoraciones.unshift({ ...this.nuevaValoracion, fecha });

    // Reinicia el formulario
    this.nuevaValoracion = { cliente: '', producto: '', estrellas: 0, comentario: '' };
    alert('¡Gracias por dejar tu valoración! ⭐');
  }
}
