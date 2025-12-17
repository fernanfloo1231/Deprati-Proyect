import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

// Initialize Firebase
const app = initializeApp(environment.firebase);
const auth = getAuth(app);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(ReactiveFormsModule),
    importProvidersFrom(SweetAlert2Module),
    provideHttpClient(),
  ],
};
