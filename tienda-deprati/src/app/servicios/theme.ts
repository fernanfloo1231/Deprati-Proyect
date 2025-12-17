import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Theme {
  private darkTheme = false;

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.enableDark();
    }
  }

  toggleTheme(): void {
    this.darkTheme ? this.disableDark() : this.enableDark();
  }

  enableDark(): void {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
    this.darkTheme = true;
  }

  disableDark(): void {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
    this.darkTheme = false;
  }

  isDark(): boolean {
    return this.darkTheme;
  }
}
