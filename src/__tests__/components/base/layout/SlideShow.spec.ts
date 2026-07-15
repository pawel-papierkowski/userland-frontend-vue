import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import SlideShow from '@/components/base/layout/SlideShow.vue';

//

/** Convenience function to create component. */
function createComponent(
  slots: Record<string, string>,
  id: string,
  langPrefix: string,
  autoplay: boolean,
  interval: number,
  delay: number,
) {
  return mount(SlideShow, {
    global: {
      plugins: [i18n],
    },
    props: {
      id,
      langPrefix,
      autoplay,
      interval,
      delay,
    },
    slots,
  });
}

//

/**
 * Verify state of dots.
 * @param slideShow Slide show.
 * @param count Count of dots.
 * @param expectedIndex Index of selected dot.
 */
function verifyDot(slideShow: VueWrapper, count: number, expectedIndex: number) {
  const allDots = slideShow.findAll('.slideshow-selection-entry');
  expect(allDots.length).toBe(count);

  const actualIndex = allDots.findIndex((dot) => dot.classes().includes('active'));
  expect(actualIndex).toBe(expectedIndex);
}

/** Helper: create a 3-slide wrapper and return the tablist element. */
function createKeyboardWrapper() {
  const slideShow = createComponent({ a: 'A', b: 'B', c: 'C' }, 'myShow', 'test.slideshow', true, 3, 10);
  const tablist = slideShow.find('[role="tablist"]');
  return { slideShow, tablist };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of SlideShow component. */
describe('SlideShow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  //

  describe('general', () => {
    it('autoslide is working', async () => {
      // Check if slideshow actually does automatic slide show over all slides.
      // After last slide, next slide will be first one again, completing the loop.

      // Arrange&Act: Create component with two slides.
      const slideShow = createComponent(
        { slide1: 'A', slide2: 'B', slide3: 'C' },
        'myShow',
        'test.slideshow',
        true,
        3,
        10,
      );

      // Assert: On beginning SlideShow always show first slide.
      expect(slideShow.find('.slideshow-slide').text()).toBe('A');
      verifyDot(slideShow, 3, 0);

      // Act: Time travel.
      await vi.advanceTimersByTimeAsync(2500);

      // Assert: SlideShow is still on first slide, as not enough time passed (3000 is needed).
      expect(slideShow.find('.slideshow-slide').text()).toBe('A');
      verifyDot(slideShow, 3, 0);

      // Act: Time travel.
      await vi.advanceTimersByTimeAsync(1000); // 3500 in total

      // Assert: SlideShow switched to second slide automatically.
      expect(slideShow.find('.slideshow-slide').text()).toBe('B');
      verifyDot(slideShow, 3, 1);

      // Act: Time travel.
      await vi.advanceTimersByTimeAsync(3500);

      // Assert: SlideShow switched to third slide automatically.
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');
      verifyDot(slideShow, 3, 2);

      // Act: Time travel.
      await vi.advanceTimersByTimeAsync(3500);

      // Assert: SlideShow switched back to first slide automatically.
      // SlideShow has only three slots, so it goes from third slot back to first.
      expect(slideShow.find('.slideshow-slide').text()).toBe('A');
      verifyDot(slideShow, 3, 0);
    });

    it('autoslide off', async () => {
      // Check if slideshow stays on first slide when autoplay is false.

      // Arrange&Act: Create component with two slides.
      const slideShow = createComponent(
        { slide1: 'Slide 1', slide2: 'Slide 2' },
        'myShow',
        'test.slideshow',
        false,
        3,
        10,
      );

      // Assert: On beginning SlideShow always show first slide.
      expect(slideShow.find('.slideshow-slide').text()).toBe('Slide 1');
      verifyDot(slideShow, 2, 0);

      // Act: Time travel.
      await vi.advanceTimersByTimeAsync(3500);

      // Assert: SlideShow is still on first slide.
      expect(slideShow.find('.slideshow-slide').text()).toBe('Slide 1');
      verifyDot(slideShow, 2, 0);
    });

    //

    it('clicking on slide dot changes current slide and delays autochange', async () => {
      // Check if slideshow switches to slide after clicking. Also checks delay in changing slide after click.

      // Arrange&Act: Create component with three slides.
      const slideShow = createComponent(
        { slide1: 'A', slide2: 'B', slide3: 'C' },
        'myShow',
        'test.slideshow',
        true,
        3,
        10,
      );

      // Act: Click on last dot.
      slideShow.findAll('.slideshow-selection')[2]?.trigger('click');
      await nextTick();

      // Assert: SlideShow switched to chosen slide.
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');
      verifyDot(slideShow, 3, 2);

      // Act: Time travel.
      await vi.advanceTimersByTimeAsync(5500);

      // Assert: SlideShow is still on last slide, as not enough time passed (delay plus normal interval).
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');
      verifyDot(slideShow, 3, 2);

      // Act: Time travel.
      await vi.advanceTimersByTimeAsync(8000); // 13500 in total - we need to wait delay + interval

      // Assert: SlideShow switched to next slide automatically, but with delay due to clicking.
      expect(slideShow.find('.slideshow-slide').text()).toBe('A');
      verifyDot(slideShow, 3, 0);
    });

    it('clicking on slide dot changes current slide and stops autochange', async () => {
      // Check if slideshow switches to slide after clicking. Also ensure no slide change after click.

      // Arrange&Act: Create component with three slides.
      const slideShow = createComponent(
        { slide1: 'A', slide2: 'B', slide3: 'C' },
        'myShow',
        'test.slideshow',
        true,
        3,
        -1,
      );

      // Act: Click on last dot.
      slideShow.findAll('.slideshow-selection')[2]?.trigger('click');
      await nextTick();

      // Assert: SlideShow switched to chosen slide.
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');
      verifyDot(slideShow, 3, 2);

      // Act: Time travel.
      await vi.advanceTimersByTimeAsync(13500);

      // Assert: SlideShow is still on last slide, as delay < 0, disabling autoswitch after click.
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');
      verifyDot(slideShow, 3, 2);
    });

    it('hovering over slide is working', async () => {
      // If mouse is hovered over slide, it should not change.

      // Arrange&Act: Create component with three slides.
      const slideShow = createComponent(
        { slide1: 'A', slide2: 'B', slide3: 'C' },
        'myShow',
        'test.slideshow',
        true,
        3,
        10,
      );

      // Assert: On beginning SlideShow always show first slide.
      expect(slideShow.find('.slideshow-slide').text()).toBe('A');
      verifyDot(slideShow, 3, 0);

      // Act: Hover over SlideShow and forward time.
      slideShow.trigger('mouseenter');
      await vi.advanceTimersByTimeAsync(5000);

      // Assert: SlideShow is still on first slide, as mouse is hovered over it.
      expect(slideShow.find('.slideshow-slide').text()).toBe('A');
      verifyDot(slideShow, 3, 0);

      // Act: Remove hover and forward time.
      slideShow.trigger('mouseleave');
      await vi.advanceTimersByTimeAsync(3500);

      // Assert: SlideShow switched to other slide automatically.
      expect(slideShow.find('.slideshow-slide').text()).toBe('B');
      verifyDot(slideShow, 3, 1);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Accessibility tests

  describe('accessibility', () => {
    it('wrapper has region role and aria-label', () => {
      // The outermost container should act as a landmark region.

      // Arrange&Act: Create component with an id.
      const slideShow = createComponent({ a: 'A' }, 'myShow', 'test.slideshow', true, 3, 10);

      // Assert: Region role and label are present.
      expect(slideShow.attributes('role')).toBe('region');
      expect(slideShow.attributes('aria-label')).toBe('myShow slideshow');
    });

    it('header has tablist role', () => {
      // The dot container must expose role="tablist".

      // Arrange&Act: Create component.
      const slideShow = createComponent({ a: 'A', b: 'B' }, 'myShow', 'test.slideshow', true, 3, 10);

      // Assert: Tablist role is set.
      expect(slideShow.find('.slideshow-header').attributes('role')).toBe('tablist');
    });

    it('each dot has correct ARIA attributes', () => {
      // Every dot must have role="tab", aria-selected, aria-controls and an
      // id when an id prop is provided.

      // Arrange&Act: Create component with an id for ARIA bindings.
      const slideShow = createComponent({ a: 'A', b: 'B' }, 'myShow', 'test.slideshow', true, 3, 10);
      const tabs = slideShow.findAll('[role="tab"]');

      // Assert: Two tabs with correct attributes.
      expect(tabs).toHaveLength(2);

      // First tab (active by default).
      expect(tabs[0]?.attributes('role')).toBe('tab');
      expect(tabs[0]?.attributes('aria-selected')).toBe('true');
      expect(tabs[0]?.attributes('aria-controls')).toBe('slideshow-myShow-panel-a');
      expect(tabs[0]?.attributes('id')).toBe('slideshow-myShow-tab-a');
      expect(tabs[0]?.attributes('aria-label')).toBe('Slide 1 of 2');

      // Second tab (inactive).
      expect(tabs[1]?.attributes('aria-selected')).toBe('false');
      expect(tabs[1]?.attributes('id')).toBe('slideshow-myShow-tab-b');
      expect(tabs[1]?.attributes('aria-label')).toBe('Slide 2 of 2');
    });

    it('active dot has tabindex 0, inactive have -1', () => {
      // Only the currently selected dot should be keyboard-focusable.

      // Arrange&Act: Create component.
      const slideShow = createComponent({ a: 'A', b: 'B', c: 'C' }, 'myShow', 'test.slideshow', true, 3, 10);
      const tabs = slideShow.findAll('[role="tab"]');

      // Assert: Tabindex values.
      expect(tabs[0]?.attributes('tabindex')).toBe('0');
      expect(tabs[1]?.attributes('tabindex')).toBe('-1');
      expect(tabs[2]?.attributes('tabindex')).toBe('-1');
    });

    it('slide panel has correct ARIA attributes', () => {
      // The visible slide should carry role="tabpanel" and aria-labelledby.

      // Arrange&Act: Create component with an id.
      const slideShow = createComponent({ a: 'CONTENT A' }, 'myShow', 'test.slideshow', true, 3, 10);
      const panel = slideShow.find('[role="tabpanel"]');

      // Assert: Tabpanel attributes.
      expect(panel.attributes('role')).toBe('tabpanel');
      expect(panel.attributes('aria-labelledby')).toBe('slideshow-myShow-tab-a');
      expect(panel.attributes('id')).toBe('slideshow-myShow-panel-a');
      expect(panel.text()).toBe('CONTENT A');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Keyboard navigation tests

  describe('keyboard', () => {
    it('ArrowRight moves to next slide', async () => {
      // Pressing ArrowRight should select the next slide.

      // Arrange.
      const { slideShow, tablist } = createKeyboardWrapper();
      expect(slideShow.find('[aria-selected="true"]').text()).toBe('');

      // Act: Press ArrowRight.
      await tablist.trigger('keydown', { key: 'ArrowRight' });

      // Assert: Second slide (b) is now selected.
      expect(slideShow.find('.slideshow-slide').text()).toBe('B');
    });

    it('ArrowLeft moves to previous slide', async () => {
      // Pressing ArrowLeft should select the previous slide.

      // Arrange: Move to the last slide first.
      const { slideShow, tablist } = createKeyboardWrapper();
      await tablist.trigger('keydown', { key: 'ArrowRight' });
      await tablist.trigger('keydown', { key: 'ArrowRight' });
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');

      // Act: Press ArrowLeft.
      await tablist.trigger('keydown', { key: 'ArrowLeft' });

      // Assert: Second slide is selected.
      expect(slideShow.find('.slideshow-slide').text()).toBe('B');
    });

    it('Home moves to first slide', async () => {
      // Pressing Home should select the first slide regardless of current position.

      // Arrange: Navigate to the last slide.
      const { slideShow, tablist } = createKeyboardWrapper();
      await tablist.trigger('keydown', { key: 'End' });
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');

      // Act: Press Home.
      await tablist.trigger('keydown', { key: 'Home' });

      // Assert: First slide is selected.
      expect(slideShow.find('.slideshow-slide').text()).toBe('A');
    });

    it('End moves to last slide', async () => {
      // Pressing End should select the last slide regardless of current position.

      // Arrange.
      const { slideShow, tablist } = createKeyboardWrapper();

      // Act: Press End.
      await tablist.trigger('keydown', { key: 'End' });

      // Assert: Last slide is selected.
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');
    });

    it('ArrowLeft wraps from first to last', async () => {
      // Pressing ArrowLeft on the first slide should wrap to the last.

      // Arrange.
      const { slideShow, tablist } = createKeyboardWrapper();

      // Act: Press ArrowLeft.
      await tablist.trigger('keydown', { key: 'ArrowLeft' });

      // Assert: Last slide is selected (wrap-around).
      expect(slideShow.find('.slideshow-slide').text()).toBe('C');
    });

    it('ArrowRight wraps from last to first', async () => {
      // Pressing ArrowRight on the last slide should wrap to the first.

      // Arrange: Navigate to the last slide.
      const { slideShow, tablist } = createKeyboardWrapper();
      await tablist.trigger('keydown', { key: 'End' });

      // Act: Press ArrowRight.
      await tablist.trigger('keydown', { key: 'ArrowRight' });

      // Assert: First slide is selected (wrap-around).
      expect(slideShow.find('.slideshow-slide').text()).toBe('A');
    });
  });
});
