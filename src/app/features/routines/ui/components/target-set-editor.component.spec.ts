import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TargetSetEditorComponent } from './target-set-editor.component';
import { TargetSet } from '../../domain/target-set';

// ---- Setup ----

function makeFixture(opts: {
  trackingType?: 'weight-reps' | 'bodyweight-reps' | 'time' | 'distance-time';
  targetSets?: readonly TargetSet[];
} = {}): {
  fixture: ComponentFixture<TargetSetEditorComponent>;
} {
  void TestBed.configureTestingModule({
    imports: [TargetSetEditorComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(TargetSetEditorComponent);
  fixture.componentRef.setInput('trackingType', opts.trackingType ?? 'weight-reps');
  fixture.componentRef.setInput('targetSets', opts.targetSets ?? []);
  fixture.detectChanges();
  return { fixture };
}

// ---- Tests ----

describe('TargetSetEditorComponent (signals migration)', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('weight-reps rendering', () => {
    it('renders reps and weightKg inputs for weight-reps tracking type', () => {
      const { fixture } = makeFixture({
        trackingType: 'weight-reps',
        targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 80 }],
      });

      const inputs = fixture.debugElement.queryAll(By.css('input[type="number"]'));
      expect(inputs).toHaveLength(2);

      const labels = fixture.debugElement.queryAll(By.css('label'));
      const labelTexts = labels.map(l => (l.nativeElement as HTMLElement).textContent ?? '');
      expect(labelTexts.some(t => t.includes('Reps'))).toBe(true);
      expect(labelTexts.some(t => t.includes('Peso'))).toBe(true);
    });

    it('does NOT render duration or distance inputs for weight-reps', () => {
      const { fixture } = makeFixture({
        trackingType: 'weight-reps',
        targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 80 }],
      });

      const labels = fixture.debugElement.queryAll(By.css('label'));
      const labelTexts = labels.map(l => (l.nativeElement as HTMLElement).textContent ?? '');
      expect(labelTexts.some(t => t.includes('Dur'))).toBe(false);
      expect(labelTexts.some(t => t.includes('Dist'))).toBe(false);
    });
  });

  describe('bodyweight-reps rendering', () => {
    it('renders reps and extraWeightKg inputs for bodyweight-reps, NOT weightKg/duration/distance', () => {
      const { fixture } = makeFixture({
        trackingType: 'bodyweight-reps',
        targetSets: [{ type: 'bodyweight-reps', reps: 12 }],
      });

      const inputs = fixture.debugElement.queryAll(By.css('input[type="number"]'));
      expect(inputs).toHaveLength(2); // reps + extraWeightKg

      const labels = fixture.debugElement.queryAll(By.css('label'));
      const labelTexts = labels.map(l => (l.nativeElement as HTMLElement).textContent ?? '');
      expect(labelTexts.some(t => t.includes('Reps'))).toBe(true);
      expect(labelTexts.some(t => t.includes('extra'))).toBe(true);
      expect(labelTexts.some(t => t.includes('Dur'))).toBe(false);
      expect(labelTexts.some(t => t.includes('Dist'))).toBe(false);
    });
  });

  describe('outputs', () => {
    it('emits updated targetSets array via targetSetsChange on field change', () => {
      const { fixture } = makeFixture({
        trackingType: 'weight-reps',
        targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 80 }],
      });

      const emitted: TargetSet[][] = [];
      fixture.componentInstance.targetSetsChange.subscribe((sets: TargetSet[]) => {
        emitted.push(sets);
      });

      const repsInput = fixture.debugElement.query(By.css('input[type="number"]'));
      const inputEl = repsInput.nativeElement as HTMLInputElement;
      inputEl.value = '10';
      inputEl.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]![0]!).toMatchObject({ reps: 10 });
    });

    it('emits array of length n+1 on "Agregar serie" click', () => {
      const { fixture } = makeFixture({
        trackingType: 'weight-reps',
        targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 80 }],
      });

      const emitted: TargetSet[][] = [];
      fixture.componentInstance.targetSetsChange.subscribe((sets: TargetSet[]) => {
        emitted.push(sets);
      });

      const addBtn = fixture.debugElement.queryAll(By.css('button')).find(b =>
        ((b.nativeElement as HTMLElement).textContent ?? '').includes('Agregar'),
      );
      expect(addBtn).toBeTruthy();
      (addBtn!.nativeElement as HTMLButtonElement).click();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toHaveLength(2);
    });

    it('emits array of length n-1 on remove button click', () => {
      const { fixture } = makeFixture({
        trackingType: 'weight-reps',
        targetSets: [
          { type: 'weight-reps', reps: 8, weightKg: 80 },
          { type: 'weight-reps', reps: 10, weightKg: 60 },
        ],
      });

      const emitted: TargetSet[][] = [];
      fixture.componentInstance.targetSetsChange.subscribe((sets: TargetSet[]) => {
        emitted.push(sets);
      });

      const removeBtn = fixture.debugElement.queryAll(By.css('button')).find(b =>
        ((b.nativeElement as HTMLElement).textContent ?? '').includes('Quitar'),
      );
      expect(removeBtn).toBeTruthy();
      (removeBtn!.nativeElement as HTMLButtonElement).click();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toHaveLength(1);
      // The remaining entry should be the second one (index 1)
      expect(emitted[0]![0]!).toMatchObject({ reps: 10 });
    });

    it('signal input update via setInput is reflected in rendered DOM', () => {
      const { fixture } = makeFixture({
        trackingType: 'weight-reps',
        targetSets: [],
      });

      // Initially no sets → no number inputs
      expect(fixture.debugElement.queryAll(By.css('input[type="number"]'))).toHaveLength(0);

      // Update via setInput (signal input API)
      fixture.componentRef.setInput('targetSets', [{ type: 'weight-reps', reps: 5, weightKg: 40 }]);
      fixture.detectChanges();

      expect(fixture.debugElement.queryAll(By.css('input[type="number"]'))).toHaveLength(2);
    });
  });
});
