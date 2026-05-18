/**
 * FgPageHeaderComponent spec (Slice C).
 * TDD strict — RED before implementation.
 * Covers V-D1-1 through V-D1-8 per spec.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FgPageHeaderComponent, type PageHeaderAction } from './page-header.component';

describe('FgPageHeaderComponent', () => {
  let fixture: ComponentFixture<FgPageHeaderComponent>;

  async function create(inputs: {
    title: string;
    subtitle?: string;
    leadingIcon?: string;
    trailingActions?: ReadonlyArray<PageHeaderAction>;
  }): Promise<void> {
    fixture = TestBed.createComponent(FgPageHeaderComponent);
    fixture.componentRef.setInput('title', inputs.title);
    if (inputs.subtitle !== undefined) fixture.componentRef.setInput('subtitle', inputs.subtitle);
    if (inputs.leadingIcon !== undefined) fixture.componentRef.setInput('leadingIcon', inputs.leadingIcon);
    if (inputs.trailingActions !== undefined) fixture.componentRef.setInput('trailingActions', inputs.trailingActions);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgPageHeaderComponent],
    }).compileComponents();
  });

  // V-D1-1: Title renders
  it('renders title text in the title element', async () => {
    await create({ title: 'Progreso' });
    const el = fixture.nativeElement as HTMLElement;
    const titleEl = el.querySelector('.t-h1');
    expect(titleEl?.textContent?.trim()).toBe('Progreso');
  });

  // V-D1-2: Subtitle renders when provided
  it('renders subtitle when subtitle is provided', async () => {
    await create({ title: 'Progreso', subtitle: '42 PRs' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('42 PRs');
  });

  // V-D1-3: Subtitle absent when undefined
  it('does NOT render subtitle element when subtitle is undefined', async () => {
    await create({ title: 'Progreso' });
    const el = fixture.nativeElement as HTMLElement;
    // no subtitle text should be in DOM from the subtitle-specific element
    const subtitleEl = el.querySelector('.t-body-sm');
    expect(subtitleEl).toBeNull();
  });

  // V-D1-4: Leading button renders when leadingIcon provided
  it('renders a leading button when leadingIcon is provided', async () => {
    await create({ title: 'Progreso', leadingIcon: 'arrow-right' });
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('.fg-page-header__icon-btn');
    expect(btn).toBeTruthy();
  });

  // V-D1-5: Leading button absent when leadingIcon undefined
  it('does NOT render leading button when leadingIcon is undefined', async () => {
    await create({ title: 'Progreso' });
    const el = fixture.nativeElement as HTMLElement;
    // With no leading icon, no .fg-page-header__icon-btn in leading slot
    // The only icon-btn would come from trailing actions — with empty array, none should exist
    const btns = el.querySelectorAll('.fg-page-header__icon-btn');
    expect(btns.length).toBe(0);
  });

  // V-D1-6: leadingClick emits on leading button click
  it('emits leadingClick output when leading button is clicked', async () => {
    await create({ title: 'Progreso', leadingIcon: 'arrow-right' });
    let emitCount = 0;
    fixture.componentInstance.leadingClick.subscribe(() => { emitCount++; });
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector<HTMLButtonElement>('.fg-page-header__icon-btn');
    btn?.click();
    fixture.detectChanges();
    expect(emitCount).toBe(1);
  });

  // V-D1-7: Trailing icons render matching array count with correct aria-labels
  it('renders N trailing buttons matching trailingActions array length with correct aria-label', async () => {
    const actions: PageHeaderAction[] = [
      { icon: 'calendar', ariaLabel: 'Ver calendario', click: jest.fn() },
    ];
    await create({ title: 'Progreso', trailingActions: actions });
    const el = fixture.nativeElement as HTMLElement;
    const btns = el.querySelectorAll('[aria-label="Ver calendario"]');
    expect(btns.length).toBe(1);
  });

  // V-D1-8: trailingClick emits with correct index when second trailing button clicked
  it('calls the click callback with correct index when second trailing button is clicked', async () => {
    const clickFn1 = jest.fn();
    const clickFn2 = jest.fn();
    const actions: PageHeaderAction[] = [
      { icon: 'calendar', ariaLabel: 'Acción 1', click: clickFn1 },
      { icon: 'settings', ariaLabel: 'Acción 2', click: clickFn2 },
    ];
    await create({ title: 'Progreso', trailingActions: actions });
    const el = fixture.nativeElement as HTMLElement;
    const btns = el.querySelectorAll<HTMLButtonElement>('.fg-page-header__actions .fg-page-header__icon-btn');
    btns[1]?.click();
    expect(clickFn2).toHaveBeenCalledTimes(1);
    expect(clickFn1).not.toHaveBeenCalled();
  });

  // V-D1-8 extra: placeholder aria-hidden slots when no leading/trailing
  it('renders placeholder aria-hidden slots when leadingIcon undefined and trailingActions empty', async () => {
    await create({ title: 'Progreso' });
    const el = fixture.nativeElement as HTMLElement;
    const slots = el.querySelectorAll('[aria-hidden="true"]');
    expect(slots.length).toBeGreaterThanOrEqual(2);
  });
});
