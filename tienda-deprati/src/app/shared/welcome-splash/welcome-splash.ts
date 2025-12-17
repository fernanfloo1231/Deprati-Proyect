import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-splash.html',
  styleUrls: ['./welcome-splash.css'],
})
export class WelcomeSplashComponent implements OnInit {

  @Output() finished = new EventEmitter<void>();

  ngOnInit(): void {
    // ⏱️ Duración del splash (3 segundos)
    setTimeout(() => {
      this.finished.emit();
    }, 7000);
  }
}
