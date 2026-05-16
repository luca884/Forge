import { Component } from '@angular/core';
import { AppLayoutComponent } from './shell/layout/app-layout.component';

@Component({
  selector: 'fg-root',
  standalone: true,
  imports: [AppLayoutComponent],
  template: `<fg-app-layout />`,
})
export class AppComponent {}
