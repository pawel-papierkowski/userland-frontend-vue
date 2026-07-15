/** Navigation-related utility functions. */
export class NavUtils {
  static readonly focusable =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /**
   * Starting from current element, focus on next focusable element on page. Does nothing in case of failure.
   * @param currElement Current element.
   */
  public static FocusNext(currElement: HTMLElement | null) {
    if (!currElement) return;

    const allFocusable = document.querySelectorAll<HTMLElement>(NavUtils.focusable);
    const idx = Array.from(allFocusable).indexOf(currElement as HTMLElement);
    if (idx === -1) return; // current element is not focusable anyway

    let nextElement: HTMLElement | null = null;
    if (idx + 1 < allFocusable.length) {
      nextElement = allFocusable[idx + 1] || null;
      nextElement!.focus();
    }
    // DEBUG
    //console.warn(`FocusNext() called. Result count: ${allFocusable.length}, currElement ix=${idx}, nextElement: ${nextElement === null ? 'null' : nextElement.tagName}`);
  }

  /**
   * Starting from current element, focus on next focusable element INSIDE current element. If it fails, focus on current element.
   * @param currElement Current element.
   */
  public static FocusNextInside(currElement: HTMLElement | null) {
    if (!currElement) return;

    const firstFocusable = currElement.querySelector<HTMLElement>(NavUtils.focusable);
    (firstFocusable ?? currElement).focus();
  }
}
