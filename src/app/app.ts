import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SopRepositoryService } from './core/services/sop-repository.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly repository = inject(SopRepositoryService);

  ngOnInit(): void {
    void this.repository.loadContent();
  }
}
