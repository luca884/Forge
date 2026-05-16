import { TestBed } from '@angular/core/testing';
import { NotificationPermissionService } from './notification-permission.service';

// Helper to install a mock Notification API on window
function installMockNotification(permission: NotificationPermission): void {
  (window as Window & { Notification?: unknown }).Notification = {
    permission,
    requestPermission: jest.fn().mockResolvedValue(permission),
  };
}

function removeMockNotification(): void {
  delete (window as Window & { Notification?: unknown }).Notification;
}

describe('NotificationPermissionService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  describe('when Notification API is unavailable', () => {
    beforeEach(() => {
      removeMockNotification();
      TestBed.configureTestingModule({});
    });

    it('should initialize permission to default when Notification is unavailable', () => {
      const service = TestBed.inject(NotificationPermissionService);
      expect(service.permission()).toBe('default');
    });

    it('should report supported() as false when Notification API is absent', () => {
      const service = TestBed.inject(NotificationPermissionService);
      expect(service.supported()).toBe(false);
    });

    it('should set permission to denied and NOT throw when request() is called', async () => {
      const service = TestBed.inject(NotificationPermissionService);
      await expect(service.request()).resolves.toBeUndefined();
      expect(service.permission()).toBe('denied');
    });

    it('should silently no-op on showTimerDoneNotification() when Notification is unavailable', () => {
      const service = TestBed.inject(NotificationPermissionService);
      expect(() => service.showTimerDoneNotification()).not.toThrow();
    });
  });

  describe('when Notification API is available', () => {
    beforeEach(() => {
      installMockNotification('default');
      TestBed.configureTestingModule({});
    });

    afterEach(() => {
      removeMockNotification();
    });

    it('should initialize permission from Notification.permission', () => {
      const service = TestBed.inject(NotificationPermissionService);
      expect(service.permission()).toBe('default');
    });

    it('should report supported() as true when Notification API is present', () => {
      const service = TestBed.inject(NotificationPermissionService);
      expect(service.supported()).toBe(true);
    });

    it('should update permission signal to granted after request()', async () => {
      installMockNotification('granted');
      const service = TestBed.inject(NotificationPermissionService);
      await service.request();
      expect(service.permission()).toBe('granted');
    });

    it('should NOT throw on showTimerDoneNotification() when permission is denied', () => {
      const service = TestBed.inject(NotificationPermissionService);
      service['permission'].set('denied');
      expect(() => service.showTimerDoneNotification()).not.toThrow();
    });
  });
});
