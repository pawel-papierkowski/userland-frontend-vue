import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import SlideShow from '@/components/base/layout/SlideShow.vue';

//

/** Boilerplate code. */
function createComponent(slots: Record<string, string>, autoplay: boolean, interval: number, delay: number) {
  return mount(SlideShow, {
      props: {
        autoplay, interval, delay,
      },
      slots
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

  const actualIndex = allDots.findIndex(dot => dot.classes().includes('active'));
  expect(actualIndex).toBe(expectedIndex);
}

//

/** Tests of SlideShow component. */
describe('SlideShow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  //

  it('autoslide is working', async () => {
    // Check if slideshow actually does automatic slide show over all slides.
    // After last slide, next slide will be first one again, completing the loop.

    // Arrange&Act: Create component with two slides.
    const slideShow = createComponent({slide1: 'A', slide2: 'B', slide3: 'C'}, true, 3, 10);

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
    const slideShow = createComponent({slide1: 'Slide 1', slide2: 'Slide 2'}, false, 3, 10);

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
    const slideShow = createComponent({slide1: 'A', slide2: 'B', slide3: 'C'}, true, 3, 10);

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
    const slideShow = createComponent({slide1: 'A', slide2: 'B', slide3: 'C'}, true, 3, -1);

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
    const slideShow = createComponent({slide1: 'A', slide2: 'B', slide3: 'C'}, true, 3, 10);

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
