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
    // Check if slideshow actually does automatic slide show.

    // Arrange&Act: Create component with two slides.
    const slideShow = createComponent({slide1: 'Hello', slide2: 'World'}, true, 3, 10);

    // Assert: on beginning SlideShow always show first slide.
    expect(slideShow.find('.slideshow-slide').text()).toBe('Hello');
    verifyDot(slideShow, 2, 0);

    // Act: Time travel.
    await vi.advanceTimersByTimeAsync(2500);

    // Assert: SlideShow is still on first slide, as not enough time passed (3000 is needed).
    expect(slideShow.find('.slideshow-slide').text()).toBe('Hello');
    verifyDot(slideShow, 2, 0);

    // Act: Time travel.
    await vi.advanceTimersByTimeAsync(1000); // 3500 in total

    // Assert: SlideShow switched to other slide automatically.
    expect(slideShow.find('.slideshow-slide').text()).toBe('World');
    verifyDot(slideShow, 2, 1);
  });

  it('autoslide off', async () => {
    // Check if slideshow stays on first slide when autoplay is false.

    // Arrange&Act: Create component with two slides.
    const slideShow = createComponent({slide1: 'Slide 1', slide2: 'Slide 2'}, false, 3, 10);

    // Assert: on beginning SlideShow always show first slide.
    expect(slideShow.find('.slideshow-slide').text()).toBe('Slide 1');
    verifyDot(slideShow, 2, 0);

    // Act: Time travel.
    await vi.advanceTimersByTimeAsync(3500);

    // Assert: SlideShow is still on first slide.
    expect(slideShow.find('.slideshow-slide').text()).toBe('Slide 1');
    verifyDot(slideShow, 2, 0);
  });

  //

  it('clicking on slide is working', async () => {
    // Check if slideshow switches to slide after clicking.

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
});
