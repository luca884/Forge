/**
 * PrCelebrationComponent spec (D-3).
 * TDD strict — RED before implementation.
 * Tests unit input propagation through DisplayWeightPipe.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrCelebrationComponent } from './pr-celebration.component';
import type { WorkedSet } from '../../domain/worked-set';

const weightRepsSet: WorkedSet = {
  id: 'ws-1',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'weight-reps',
  reps: { value: 5 } as any,
  weight: { value: 100 } as any,
  isPR: true,
  createdAt: new Date('2026-01-01'),
};

describe('PrCelebrationComponent', () => {
  let fixture: ComponentFixture<PrCelebrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrCelebrationComponent],
    }).compileComponents();
  });

  it('renders weight-reps PR with unit="kg" showing kg suffix', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('unit', 'kg');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('100 kg');
  });

  it('renders weight-reps PR with unit="lb" showing lb value', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('unit', 'lb');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('220.5 lb');
  });
});
