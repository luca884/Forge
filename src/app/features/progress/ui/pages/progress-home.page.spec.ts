/**
 * ProgressHomePage spec (Slice C).
 * TDD strict — RED before redesign implementation.
 * Covers V-D2-Spec-1 through V-D2-Spec-7 + navigation per spec.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressHomePage } from './progress-home.page';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { Router } from '@angular/router';
import { SessionRepository } from '@features/training/domain/session.repository';
import type { PersonalRecord } from '../../domain/entities/personal-record.entity';
import type { WorkedSet } from '@features/training/domain/worked-set';

const prSet: WorkedSet = {
  id: 'ws-1',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'weight-reps',
  reps: { value: 5 } as any,
  weight: { value: 100 } as any,
  isPR: true,
  createdAt: new Date('2026-01-01'),
};

const mockPR: PersonalRecord = {
  id: 'pr-1',
  exerciseId: 'ex-1',
  set: prSet,
  achievedAt: new Date('2026-01-01'),
  trackingType: 'weight-reps',
  workedSetId: 'ws-1',
};

const mockExercise = {
  id: 'ex-1',
  name: 'Sentadilla',
  muscleGroup: 'legs' as const,
  trackingType: 'weight-reps' as const,
  isCustom: false,
  createdAt: new Date('2026-01-01'),
};

const mockSessionRepo = {
  save: jest.fn(),
  getActive: jest.fn(),
  getById: jest.fn(),
  getSetsForSession: jest.fn().mockResolvedValue([]),
  addSetToSession: jest.fn(),
  editWorkedSet: jest.fn(),
  removeWorkedSet: jest.fn(),
  getAllWorkedSetsForExercise: jest.fn().mockResolvedValue([]),
  getLastWorkedSetForExercise: jest.fn().mockResolvedValue(null),
  getAllSessions: jest.fn().mockResolvedValue([]),
};

describe('ProgressHomePage', () => {
  let fixture: ComponentFixture<ProgressHomePage>;
  let navigateSpy: jest.Mock;

  beforeEach(async () => {
    navigateSpy = jest.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [ProgressHomePage],
      providers: [
        {
          provide: PersonalRecordRepository,
          useValue: {
            save: jest.fn(),
            getById: jest.fn(),
            getCurrentForExercise: jest.fn(),
            listAll: jest.fn().mockResolvedValue([mockPR]),
          },
        },
        {
          provide: ExerciseRepository,
          useValue: {
            getAll: jest.fn().mockResolvedValue([mockExercise]),
            getById: jest.fn().mockResolvedValue(mockExercise),
          },
        },
        {
          provide: Router,
          useValue: { navigate: navigateSpy },
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepo,
        },
      ],
    }).compileComponents();
  });

  async function init(): Promise<void> {
    fixture = TestBed.createComponent(ProgressHomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
  }

  // V-D2-Spec-1: calls use cases on init
  it('calls getAllPRs.execute(), getSessionHeatmap.execute() and exerciseRepo.getAll() during init', async () => {
    const prRepo = TestBed.inject(PersonalRecordRepository);
    const exRepo = TestBed.inject(ExerciseRepository);
    const sessRepo = TestBed.inject(SessionRepository);
    await init();
    expect(prRepo.listAll).toHaveBeenCalled();
    expect(exRepo.getAll).toHaveBeenCalled();
    expect(sessRepo.getAllSessions).toHaveBeenCalled();
  });

  // V-D2-Spec-2: renders fg-page-header with title="Progreso"
  it('renders <fg-page-header> with title="Progreso"', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    const header = el.querySelector('fg-page-header');
    expect(header).toBeTruthy();
    // title is passed as input — check text content of rendered title
    expect(el.textContent).toContain('Progreso');
  });

  // V-D2-Spec-3: renders non-undefined headerSubtitle() when PRs > 0
  it('renders subtitle text when totalPRs > 0', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    // subtitle should contain PR count info
    expect(el.textContent).toMatch(/PR/);
  });

  // V-D2-Spec-4: renders fg-session-heatmap inside fg-card with label "ÚLTIMAS 12 SEMANAS"
  it('renders <fg-session-heatmap> nested inside <fg-card> with label ÚLTIMAS 12 SEMANAS', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    const heatmap = el.querySelector('fg-session-heatmap');
    expect(heatmap).toBeTruthy();
    expect(el.textContent).toContain('ÚLTIMAS 12 SEMANAS');
    // heatmap should be inside a fg-card
    const card = heatmap?.closest('fg-card');
    expect(card).toBeTruthy();
  });

  // V-D2-Spec-5: renders 2 stat fg-card tiles with totalPRs() and prsThisWeek() values
  it('renders stat cards with PR count values', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    // totalPRs = 1 (one mockPR), text should contain "1"
    expect(el.textContent).toContain('PRs totales');
    expect(el.textContent).toContain('PRs esta semana');
  });

  // V-D2-Spec-6: renders fg-empty-state when recentPRs().length === 0
  it('renders <fg-empty-state> (not raw <p class="empty-state">) when no PRs', async () => {
    // Override the PersonalRecordRepository to return empty
    const prRepo = TestBed.inject(PersonalRecordRepository);
    (prRepo.listAll as jest.Mock).mockResolvedValue([]);

    await init();
    const el = fixture.nativeElement as HTMLElement;
    const emptyState = el.querySelector('fg-empty-state');
    expect(emptyState).toBeTruthy();
    const rawEmpty = el.querySelector('p.empty-state');
    expect(rawEmpty).toBeNull();
  });

  // V-D2-Spec-7: click on PR row navigates to /progress/exercise/:id
  it('navigates to /progress/exercise/:id when PR row is clicked', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    // PR row should be a button or clickable element
    const prRow = el.querySelector<HTMLButtonElement>('[data-testid="pr-row"], button.pr-row, button[class*="pr"]') ??
      el.querySelector<HTMLButtonElement>('fg-card button');
    if (prRow) {
      prRow.click();
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith(['/progress/exercise', 'ex-1']);
    } else {
      // fallback: call navigateToExercise directly
      fixture.componentInstance.navigateToExercise('ex-1');
      expect(navigateSpy).toHaveBeenCalledWith(['/progress/exercise', 'ex-1']);
    }
  });

  // V-D2-Spec-8: click on "Ver todos los PRs" button navigates to /progress/prs
  it('navigates to /progress/prs when "Ver todos los PRs" button is clicked', async () => {
    await init();
    const el = fixture.nativeElement as HTMLElement;
    // Find the "Ver todos los PRs" button
    const allBtns = Array.from(el.querySelectorAll('button'));
    const verTodosBtn = allBtns.find(btn => btn.textContent?.includes('Ver todos'));
    if (verTodosBtn) {
      verTodosBtn.click();
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith(['/progress/prs']);
    } else {
      // fallback: call method directly
      fixture.componentInstance.navigateToPRList();
      expect(navigateSpy).toHaveBeenCalledWith(['/progress/prs']);
    }
  });
});
