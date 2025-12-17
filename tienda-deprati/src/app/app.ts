import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './componentes/navbar/navbar';
import { HttpClientModule } from '@angular/common/http';
import { WelcomeSplashComponent } from './shared/welcome-splash/welcome-splash';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
  CommonModule,
  RouterOutlet,
  NavbarComponent,
  HttpClientModule,
  WelcomeSplashComponent
],

templateUrl: './app.html',

  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit, OnDestroy {

  showSplash = true; // 👈 NUEVO

  private readonly keyHandler = (e: KeyboardEvent) => {
    if (e.altKey && (e.key === 'h' || e.key === 'H')) {
      this.router.navigate(['/admin']);
      e.preventDefault();
    }
  };

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    globalThis.addEventListener('keydown', this.keyHandler as any);

    // ⏱️ Ocultar splash después de 3s
    setTimeout(() => {
      this.showSplash = false;
    }, 3000);
  }

  ngOnDestroy(): void {
    globalThis.removeEventListener('keydown', this.keyHandler as any);
  }
}

