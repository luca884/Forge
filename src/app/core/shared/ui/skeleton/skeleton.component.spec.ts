import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FgSkeletonComponent } from './skeleton.component';

describe('FgSkeletonComponent', () => {
  let fixture: ComponentFixture<FgSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgSkeletonComponent],
    }).compileComponents();
  });

  function create(inputs: { width?: string | number; height?: number; radius?: number } = {}): void {
    fixture = TestBed.createComponent(FgSkeletonComponent);
    if (inputs.width !== undefined) fixture.componentRef.setInput('width', inputs.width);
    if (inputs.height !== undefined) fixture.componentRef.setInput('height', inputs.height);
    if (inputs.radius !== undefined) fixture.componentRef.setInput('radius', inputs.radius);
    fixture.detectChanges();
  }

  it('selector es fg-skeleton y el componente se instancia', () => {
    create();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('width input', () => {
    it('aplica width 100% por defecto', () => {
      create();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.width).toBe('100%');
    });

    it('aplica width "60%" cuando se pasa width="60%"', () => {
      create({ width: '60%' });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.width).toBe('60%');
    });

    it('aplica width "200px" cuando se pasa width=200 (number)', () => {
      create({ width: 200 });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.width).toBe('200px');
    });
  });

  describe('height input', () => {
    it('aplica height 12px por defecto', () => {
      create();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.height).toBe('12px');
    });

    it('aplica height 16px cuando se pasa height=16', () => {
      create({ height: 16 });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.height).toBe('16px');
    });
  });

  describe('radius input', () => {
    it('aplica border-radius 6px por defecto', () => {
      create();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.borderRadius).toBe('6px');
    });

    it('aplica border-radius 12px cuando se pasa radius=12', () => {
      create({ radius: 12 });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.style.borderRadius).toBe('12px');
    });
  });

  describe('animation class', () => {
    it('el host tiene clase fg-skeleton para la animación shimmer', () => {
      create();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.className).toContain('fg-skeleton');
    });
  });
});
