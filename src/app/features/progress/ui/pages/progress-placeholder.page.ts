import { Component } from '@angular/core';

@Component({
  selector: 'fg-progress-placeholder-page',
  standalone: true,
  template: `
    <div class="progress-placeholder">
      <h1>Progreso</h1>
      <p>Próximamente — disponible en slice-2.</p>
    </div>
  `,
  styles: `
    .progress-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #888;
    }

    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
  `,
})
export class ProgressPlaceholderPage {}
