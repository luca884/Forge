import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel';
export type InputMode = 'decimal' | 'numeric' | 'text';

const SIZE_HEIGHT: Record<InputSize, string> = {
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-14',
};

const SIZE_TEXT: Record<InputSize, string> = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-[17px]',
};

@Component({
  selector: 'fg-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FgInputComponent),
      multi: true,
    },
  ],
  template: `
    <label class="flex flex-col gap-1.5">
      @if (label()) {
        <span class="t-caption text-forge-300">{{ label() }}</span>
      }
      <div class="flex items-center rounded-md bg-forge-900 px-3.5 gap-2 ring-1 ring-inset"
           [class]="fieldClasses()">
        @if (prefix()) {
          <span class="t-body-sm text-forge-400">{{ prefix() }}</span>
        }
        <input
          [type]="type()"
          [placeholder]="placeholder() ?? ''"
          [attr.inputmode]="inputmode() ?? null"
          [disabled]="isDisabled()"
          [value]="value()"
          (input)="onInput($event)"
          (blur)="onBlur()"
          class="flex-1 min-w-0 h-full bg-transparent outline-none border-0 text-forge-50 font-sans"
          [class]="inputClasses()"
        />
        @if (suffix()) {
          <span class="t-body-sm text-forge-400">{{ suffix() }}</span>
        }
      </div>
      @if (error()) {
        <span class="t-body-sm text-destructive-500">{{ error() }}</span>
      } @else if (helper()) {
        <span class="t-body-sm text-forge-400">{{ helper() }}</span>
      }
    </label>
  `,
})
export class FgInputComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly helper = input<string | undefined>(undefined);
  readonly error = input<string | undefined>(undefined);
  readonly prefix = input<string | undefined>(undefined);
  readonly suffix = input<string | undefined>(undefined);
  readonly type = input<InputType>('text');
  readonly size = input<InputSize>('md');
  readonly tabularNums = input<boolean>(false);
  readonly placeholder = input<string | undefined>(undefined);
  readonly inputmode = input<InputMode | undefined>(undefined);

  readonly value = signal<string>('');
  readonly isDisabled = signal<boolean>(false);

  readonly fieldClasses = computed(() => [
    SIZE_HEIGHT[this.size()],
    this.error() ? 'ring-destructive-500/50' : 'ring-forge-800',
  ].join(' '));

  readonly inputClasses = computed(() => [
    SIZE_TEXT[this.size()],
    this.tabularNums() ? 'tabular-nums' : '',
  ].filter(Boolean).join(' '));

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
