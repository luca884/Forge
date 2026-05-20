import { Injectable, signal } from '@angular/core';
import { ToastKind } from './toast.component';

export interface Toast {
  readonly id: number;
  readonly title: string;
  readonly body?: string;
  readonly kind: ToastKind;
}

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _nextId = 1;
  private readonly _toasts = signal<readonly Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  show(input: {
    title: string;
    body?: string;
    kind?: ToastKind;
    duration?: number;
  }): number {
    const id = this._nextId++;
    const toast: Toast = {
      id,
      title: input.title,
      body: input.body,
      kind: input.kind ?? 'info',
    };

    this._toasts.update(current => [...current, toast]);

    const duration = input.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  success(title: string, body?: string): number {
    return this.show({ title, body, kind: 'success', duration: DEFAULT_DURATION });
  }

  error(title: string, body?: string): number {
    return this.show({ title, body, kind: 'error', duration: ERROR_DURATION });
  }

  info(title: string, body?: string): number {
    return this.show({ title, body, kind: 'info', duration: DEFAULT_DURATION });
  }

  dismiss(id: number): void {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
