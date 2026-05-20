import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FgToastOutletComponent } from './toast-outlet.component';
import { ToastService } from './toast.service';

describe('FgToastOutletComponent', () => {
  let fixture: ComponentFixture<FgToastOutletComponent>;
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgToastOutletComponent],
    }).compileComponents();

    service = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(FgToastOutletComponent);
    fixture.detectChanges();
  });

  it('renders no fg-toast elements when the queue is empty', () => {
    const toasts = fixture.debugElement.queryAll(By.css('fg-toast'));
    expect(toasts).toHaveLength(0);
  });

  it('renders one fg-toast when one toast is in the queue', () => {
    service.show({ title: 'Hello', duration: 0 });
    fixture.detectChanges();

    const toasts = fixture.debugElement.queryAll(By.css('fg-toast'));
    expect(toasts).toHaveLength(1);
  });

  it('renders N fg-toast elements for N toasts', () => {
    service.show({ title: 'First', duration: 0 });
    service.show({ title: 'Second', duration: 0 });
    service.show({ title: 'Third', duration: 0 });
    fixture.detectChanges();

    const toasts = fixture.debugElement.queryAll(By.css('fg-toast'));
    expect(toasts).toHaveLength(3);
  });

  it('passes the correct title to each fg-toast', () => {
    service.show({ title: 'Toast Alpha', duration: 0 });
    service.show({ title: 'Toast Beta', duration: 0 });
    fixture.detectChanges();

    const nativeEl = fixture.nativeElement as HTMLElement;
    expect(nativeEl.textContent).toContain('Toast Alpha');
    expect(nativeEl.textContent).toContain('Toast Beta');
  });

  it('removes the toast from view when dismiss is emitted on the fg-toast', async () => {
    service.show({ title: 'Dismissable', duration: 0 });
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('fg-toast'))).toHaveLength(1);

    // Trigger dismiss via the component's dismiss output
    const toastEl = fixture.debugElement.query(By.css('fg-toast'));
    expect(toastEl).not.toBeNull();
    (toastEl.componentInstance as { dismiss: { emit: () => void } }).dismiss.emit();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('fg-toast'))).toHaveLength(0);
  });
});
