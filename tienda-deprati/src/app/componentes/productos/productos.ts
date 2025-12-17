import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { CarritoService } from '../../enlace/carrito.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  productos: any[] = [];

  constructor(private readonly router: Router, private carritoService: CarritoService) {}

  ngOnInit(): void {
    try {
      const raw = localStorage.getItem('productos');
      this.productos = raw ? JSON.parse(raw) : [];
      console.log(' Productos cargados desde localStorage:', this.productos);
    } catch (e) {
      console.warn('Error cargando productos', e);
      this.productos = [];
    }
  }
getPrecioFinal(p: any): number {
  if (p.precio_oferta != null && p.precio_oferta > 0) {
    return Number(p.precio_oferta);
  }

  return Number(p.precio_normal);
}


  verDetalle(p: any) {
    const id = p.id || p.id_producto;
    if (!id) {
      console.error(' Producto sin ID:', p);
      return;
    }

    this.router.navigate(['/producto', id]);
  }

 agregarAlCarrito(p: any) {
  console.log('🛒 Producto completo recibido:', p);

  const productoCarrito = {
    id: p.id_producto ?? p.id,
    nombre: p.nombre,
    precio: this.getPrecioFinal(p), // 🔥 AQUÍ YA VA 18
    imagen: p.imagen_url ?? p.imagen,
    cantidad: 1,
    stock: p.stock ?? 0,
  };

  this.carritoService.agregarProducto(productoCarrito);

  Swal.fire({
    icon: 'success',
    title: '¡Producto agregado!',
    text: `${p.nombre} añadido al carrito`,
    timer: 1500,
    showConfirmButton: false,
  });
}

}
