import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---- show() ---------------------------------------------------------------

  describe('show()', () => {
    it('adds a toast with default kind=info when kind is omitted', () => {
      service.show({ title: 'Hello' });
      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Hello');
      expect(toasts[0].kind).toBe('info');
    });

    it('adds a toast with the explicit kind when provided', () => {
      service.show({ title: 'Saved', kind: 'success' });
      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].kind).toBe('success');
    });

    it('adds body when provided', () => {
      service.show({ title: 'Title', body: 'Some detail' });
      expect(service.toasts()[0].body).toBe('Some detail');
    });

    it('returns the id of the new toast', () => {
      const id = service.show({ title: 'Test' });
      expect(service.toasts()[0].id).toBe(id);
    });

    it('assigns unique incrementing ids to successive toasts', () => {
      const id1 = service.show({ title: 'First' });
      const id2 = service.show({ title: 'Second' });
      const id3 = service.show({ title: 'Third' });
      expect(id2).toBe(id1 + 1);
      expect(id3).toBe(id2 + 1);
      expect(service.toasts()).toHaveLength(3);
    });
  });

  // ---- convenience methods --------------------------------------------------

  describe('success()', () => {
    it('creates a toast with kind=success', () => {
      service.success('Done', 'All good');
      const [toast] = service.toasts();
      expect(toast.kind).toBe('success');
      expect(toast.title).toBe('Done');
      expect(toast.body).toBe('All good');
    });
  });

  describe('error()', () => {
    it('creates a toast with kind=error', () => {
      service.error('Failed', 'Try again');
      const [toast] = service.toasts();
      expect(toast.kind).toBe('error');
      expect(toast.title).toBe('Failed');
      expect(toast.body).toBe('Try again');
    });
  });

  describe('info()', () => {
    it('creates a toast with kind=info', () => {
      service.info('FYI');
      const [toast] = service.toasts();
      expect(toast.kind).toBe('info');
      expect(toast.title).toBe('FYI');
    });
  });

  // ---- dismiss() ------------------------------------------------------------

  describe('dismiss()', () => {
    it('removes the toast with the given id, leaving others intact', () => {
      service.show({ title: 'Keep' });
      const removeId = service.show({ title: 'Remove' });
      service.show({ title: 'Also keep' });

      service.dismiss(removeId);

      const remaining = service.toasts();
      expect(remaining).toHaveLength(2);
      expect(remaining.find(t => t.id === removeId)).toBeUndefined();
      expect(remaining.map(t => t.title)).toContain('Keep');
      expect(remaining.map(t => t.title)).toContain('Also keep');
    });

    it('does nothing when the id does not exist', () => {
      service.show({ title: 'Toast' });
      service.dismiss(9999);
      expect(service.toasts()).toHaveLength(1);
    });
  });

  // ---- clear() --------------------------------------------------------------

  describe('clear()', () => {
    it('removes all toasts from the queue', () => {
      service.show({ title: 'A' });
      service.show({ title: 'B' });
      service.show({ title: 'C' });
      expect(service.toasts()).toHaveLength(3);

      service.clear();

      expect(service.toasts()).toHaveLength(0);
    });
  });

  // ---- auto-dismiss ---------------------------------------------------------

  describe('auto-dismiss', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('auto-dismisses after the specified duration', () => {
      service.show({ title: 'Temp', duration: 2000 });
      expect(service.toasts()).toHaveLength(1);

      jest.advanceTimersByTime(2000);

      expect(service.toasts()).toHaveLength(0);
    });

    it('does NOT auto-dismiss when duration=0', () => {
      service.show({ title: 'Permanent', duration: 0 });
      jest.advanceTimersByTime(100_000);
      expect(service.toasts()).toHaveLength(1);
    });

    it('default duration auto-dismisses after 4000 ms', () => {
      service.show({ title: 'Default duration' });
      expect(service.toasts()).toHaveLength(1);
      jest.advanceTimersByTime(3999);
      expect(service.toasts()).toHaveLength(1);
      jest.advanceTimersByTime(1);
      expect(service.toasts()).toHaveLength(0);
    });

    it('success() auto-dismisses after 4000 ms', () => {
      service.success('Done');
      jest.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(0);
    });

    it('error() auto-dismisses after 6000 ms (longer than success)', () => {
      service.error('Error');
      jest.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(1); // still showing at 4000
      jest.advanceTimersByTime(2000);
      expect(service.toasts()).toHaveLength(0); // gone at 6000
    });
  });
});
