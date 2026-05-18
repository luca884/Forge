/**
 * Barrel index.ts — smoke test: all public exports resolve correctly.
 * TDD RED: this spec must fail until index.ts is created.
 */

import {
  FgButtonComponent,
  FgCardComponent,
  FgChipComponent,
  FgEmptyStateComponent,
  FgIconComponent,
  FgInputComponent,
  FgSkeletonComponent,
  FgToastComponent,
} from './index';

import type {
  IconName,
  ButtonVariant,
  ButtonSize,
  InputSize,
  InputType,
  InputMode,
  ToastKind,
} from './index';

describe('core/shared/ui barrel (index.ts)', () => {
  describe('Component exports', () => {
    it('exports FgButtonComponent', () => {
      expect(FgButtonComponent).toBeDefined();
    });

    it('exports FgCardComponent', () => {
      expect(FgCardComponent).toBeDefined();
    });

    it('exports FgChipComponent', () => {
      expect(FgChipComponent).toBeDefined();
    });

    it('exports FgEmptyStateComponent', () => {
      expect(FgEmptyStateComponent).toBeDefined();
    });

    it('exports FgIconComponent', () => {
      expect(FgIconComponent).toBeDefined();
    });

    it('exports FgInputComponent', () => {
      expect(FgInputComponent).toBeDefined();
    });

    it('exports FgSkeletonComponent', () => {
      expect(FgSkeletonComponent).toBeDefined();
    });

    it('exports FgToastComponent', () => {
      expect(FgToastComponent).toBeDefined();
    });
  });

  describe('Type exports (compile-time check via runtime smoke)', () => {
    it('IconName type is usable', () => {
      const name: IconName = 'dumbbell';
      expect(name).toBe('dumbbell');
    });

    it('ButtonVariant type is usable', () => {
      const v: ButtonVariant = 'primary';
      expect(v).toBe('primary');
    });

    it('ButtonSize type is usable', () => {
      const s: ButtonSize = 'md';
      expect(s).toBe('md');
    });

    it('InputSize type is usable', () => {
      const s: InputSize = 'lg';
      expect(s).toBe('lg');
    });

    it('InputType type is usable', () => {
      const t: InputType = 'email';
      expect(t).toBe('email');
    });

    it('InputMode type is usable', () => {
      const m: InputMode = 'decimal';
      expect(m).toBe('decimal');
    });

    it('ToastKind type is usable', () => {
      const k: ToastKind = 'success';
      expect(k).toBe('success');
    });
  });
});
