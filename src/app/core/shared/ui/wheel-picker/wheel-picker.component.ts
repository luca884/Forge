import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Height (px) of each wheel row. Selection maps to scrollTop / WHEEL_ITEM_HEIGHT. */
export const WHEEL_ITEM_HEIGHT = 40;

/**
 * FgWheelPickerComponent — compact inline scroll-snap number wheel.
 *
 * Reemplaza al `<select>` nativo (que abre un picker que tapa toda la pantalla):
 * una ruedita embebida del tamaño de la caja, scrolleable, que engancha al centro.
 * El item centrado es el valor seleccionado. Integra con Reactive Forms vía CVA.
 */
@Component({
  selector: 'fg-wheel-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FgWheelPickerComponent),
      multi: true,
    },
  ],
  styles: [
    `
    :host { display: block; }
    .wheel {
      height: ${WHEEL_ITEM_HEIGHT * 1.6}px;
      overflow-y: auto;
      scroll-snap-type: y mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      /* center band hint */
      -webkit-mask-image: linear-gradient(to bottom, transparent, #000 28%, #000 72%, transparent);
      mask-image: linear-gradient(to bottom, transparent, #000 28%, #000 72%, transparent);
    }
    .wheel::-webkit-scrollbar { display: none; }
    .wheel-pad { height: ${(WHEEL_ITEM_HEIGHT * 1.6 - WHEEL_ITEM_HEIGHT) / 2}px; }
    .wheel-item {
      height: ${WHEEL_ITEM_HEIGHT}px;
      width: 100%;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      scroll-snap-align: center;
      scroll-snap-stop: always;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
      font-size: 20px;
      line-height: 1;
      color: rgb(var(--forge-600));
      transition: color .12s, font-size .12s;
    }
    .wheel-item.is-selected {
      font-size: 32px;
      font-weight: 600;
      letter-spacing: -0.025em;
      color: rgb(var(--forge-50));
    }
  `,
  ],
  template: `
    <div
      #scroller
      class="wheel"
      role="listbox"
      [attr.aria-label]="ariaLabel()"
      (scroll)="onScroll(scroller.scrollTop)"
    >
      <div class="wheel-pad" aria-hidden="true"></div>
      @for (opt of options(); track opt) {
        <button
          type="button"
          role="option"
          data-testid="wheel-item"
          class="wheel-item"
          [class.is-selected]="opt === value()"
          [attr.aria-selected]="opt === value()"
          (click)="select(opt)"
        >
          {{ opt }}
        </button>
      }
      <div class="wheel-pad" aria-hidden="true"></div>
    </div>
  `,
})
export class FgWheelPickerComponent implements ControlValueAccessor {
  readonly min = input<number>(1);
  readonly max = input<number>(50);
  readonly step = input<number>(1);
  readonly ariaLabel = input<string>('');

  readonly options = computed<number[]>(() => {
    const out: number[] = [];
    const step = this.step() || 1;
    for (let n = this.min(); n <= this.max(); n += step) out.push(n);
    return out;
  });

  private readonly _value = signal<number | null>(null);
  readonly value = this._value.asReadonly();

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  private onChange: (v: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    // Posiciona la rueda en el valor inicial una vez que existe el DOM.
    afterNextRender(() => this.scrollToValue());
  }

  // ── ControlValueAccessor ───────────────────────────────────────────────────

  writeValue(value: number | null): void {
    this._value.set(typeof value === 'number' ? value : null);
    this.scrollToValue();
  }

  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ── Interaction ─────────────────────────────────────────────────────────────

  /** Selects a value. Idempotent: no-op (no emit) when the value is unchanged. */
  select(value: number): void {
    if (value === this._value()) return;
    this._value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  /**
   * Maps the scroll offset to the centered item and selects it.
   * scrollTop === idx * WHEEL_ITEM_HEIGHT thanks to the symmetric padding.
   * select() is idempotent, so the programmatic scroll-into-view never loops.
   */
  onScroll(scrollTop: number): void {
    const opts = this.options();
    if (opts.length === 0) return;
    const raw = Math.round(scrollTop / WHEEL_ITEM_HEIGHT);
    const idx = Math.max(0, Math.min(opts.length - 1, raw));
    const value = opts[idx];
    if (value !== undefined) this.select(value);
  }

  private scrollToValue(): void {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    const opts = this.options();
    const current = this._value();
    const idx = current === null ? 0 : Math.max(0, opts.indexOf(current));
    el.scrollTop = idx * WHEEL_ITEM_HEIGHT;
  }
}
