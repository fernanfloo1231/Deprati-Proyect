import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home';
import { LoginComponent } from './componentes/login/login';
import { Validaciones } from './validaciones/validaciones';
import { CarritoComponent } from './componentes/carrito/carrito';
import { Registro } from './componentes/registro/registro';
import { Perfil } from './componentes/perfil/perfil';
import { ProductoDetalle } from './componentes/producto-detalle/producto-detalle';
import { RastreoPedidosComponent } from './componentes/rastreo/rastreo';
import { Admin } from './componentes/admin/admin';
import { Mujeres } from './componentes/mujeres/mujeres';
import { Hombres } from './componentes/hombres/hombres';
import { Hogar } from './componentes/hogar/hogar';
import { Tecnologia } from './componentes/tecnologia/tecnologia';
import { Ofertas } from './componentes/ofertas/ofertas';
import { Belleza } from './componentes/belleza/belleza';
import { CheckoutComponent } from './componentes/checkout/checkout';
import { PedidosComponent } from './componentes/pedidos/pedidos';
import { ChatbotComponent } from './componentes/chatbot/chatbot';
import { Buscar } from './componentes/buscar/buscar';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'carrito', component: CarritoComponent },
  { path: 'validaciones', component: Validaciones },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: Registro },
  { path: 'perfil', component: Perfil },
  { path: 'producto/:id', component: ProductoDetalle },
  { path: 'rastreo', component: RastreoPedidosComponent },
  { path: 'admin', component: Admin },
  { path: 'mujeres', component: Mujeres },
  { path: 'hombres', component: Hombres },
  { path: 'hogar', component: Hogar },
  { path: 'tecnologia', component: Tecnologia },
  { path: 'ofertas', component: Ofertas },
  { path: 'belleza', component: Belleza },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'pedidos', component: PedidosComponent },
  {
    path: 'pedido-detalle/:id',
    loadComponent: () =>
      import('./componentes/pedido-detalle/pedido-detalle').then((m) => m.PedidoDetalleComponent),
  },
  { path: 'chatbot', component: ChatbotComponent },
  { path: 'buscar', component: Buscar },
];
