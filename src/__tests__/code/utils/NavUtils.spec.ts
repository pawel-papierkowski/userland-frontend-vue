import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NavUtils } from '@/code/utils/NavUtils';

describe('NavUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // ////////////////////////////////////////////////////////////////////////////
  // FocusNext

  describe('FocusNext', () => {
    it('does nothing when current element is null', () => {
      // Arrange: Null element.
      const currElement = null;

      // Act: Attempt to focus next.
      NavUtils.FocusNext(currElement);

      // Assert: No error thrown, nothing happens.
      expect(document.activeElement).toBe(document.body);
    });

    it('does nothing when current element is not in focusable list', () => {
      // Arrange: A plain div is not focusable by default.
      document.body.innerHTML = '<div id="nonFocusable"></div>';
      const div = document.getElementById('nonFocusable')!;
      const focusSpy = vi.spyOn(div, 'focus');

      // Act: Attempt to focus next from non-focusable element.
      NavUtils.FocusNext(div);

      // Assert: No focus call.
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('focuses the next focusable element in document order', () => {
      // Arrange: Two buttons.
      document.body.innerHTML = '<button id="btnA">A</button><button id="btnB">B</button>';
      const btnA = document.getElementById('btnA')!;
      const btnB = document.getElementById('btnB')!;
      const focusSpyB = vi.spyOn(btnB, 'focus');

      // Act: Move focus from A to next.
      NavUtils.FocusNext(btnA);

      // Assert: B receives focus.
      expect(focusSpyB).toHaveBeenCalledOnce();
    });

    it('does nothing when current element is the last focusable', () => {
      // Arrange: Two buttons — B is last.
      document.body.innerHTML = '<button id="btnA">A</button><button id="btnB">B</button>';
      const btnB = document.getElementById('btnB')!;

      // Spy on any possible focus call on any element.
      const allButtons = document.querySelectorAll('button');
      const spies: ReturnType<typeof vi.spyOn>[] = [];
      for (const btn of Array.from(allButtons)) {
        spies.push(vi.spyOn(btn, 'focus'));
      }

      // Act: Attempt to move past last element.
      NavUtils.FocusNext(btnB);

      // Assert: No element had .focus() called.
      for (const spy of spies) {
        expect(spy).not.toHaveBeenCalled();
      }
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // FocusNextInside

  describe('FocusNextInside', () => {
    it('does nothing when current element is null', () => {
      // Arrange: Null element.
      const currElement = null;

      // Act: Attempt to focus next inside.
      NavUtils.FocusNextInside(currElement);

      // Assert: No error thrown, nothing happens.
      expect(document.activeElement).toBe(document.body);
    });

    it('focuses the first focusable child when one exists', () => {
      // Arrange: Container with a button inside.
      document.body.innerHTML = '<div id="container"><button id="childBtn">Click</button></div>';
      const container = document.getElementById('container')!;
      const childBtn = document.getElementById('childBtn')!;
      const focusSpy = vi.spyOn(childBtn, 'focus');

      // Act: Focus next inside container.
      NavUtils.FocusNextInside(container);

      // Assert: The child button receives focus.
      expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('focuses the container itself when it has no focusable children and is focusable', () => {
      // Arrange: A button with no focusable children.
      document.body.innerHTML = '<button id="self">Self</button>';
      const btn = document.getElementById('self')!;
      const focusSpy = vi.spyOn(btn, 'focus');

      // Act: Focus next inside button (no children).
      NavUtils.FocusNextInside(btn);

      // Assert: The button itself receives focus.
      expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('focuses the container itself when it has no focusable children and is not focusable', () => {
      // Arrange: A plain div with no focusable children.
      document.body.innerHTML = '<div id="plain">Text</div>';
      const div = document.getElementById('plain')!;
      const focusSpy = vi.spyOn(div, 'focus');

      // Act: Focus next inside div.
      NavUtils.FocusNextInside(div);

      // Assert: The div itself receives focus as fallback (focus() is a no-op for non-focusable).
      expect(focusSpy).toHaveBeenCalledOnce();
    });
  });
});
