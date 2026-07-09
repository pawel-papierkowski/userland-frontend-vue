
/** Navigation-related utility functions. */
export class NavUtils {
  /**
   * Starting from current element, focus on next focusable element.
   * @param currElement Current element.
   */
  public static FocusNext(currElement: HTMLElement | null) {
    if (!currElement) return;

    const focusable =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const allFocusable = document.querySelectorAll<HTMLElement>(focusable);
    const idx = Array.from(allFocusable).indexOf(currElement as HTMLElement);
    if (idx === -1) return; // current element is not focusable anyway

    let nextElement: HTMLElement | null = null;
    if (idx + 1 < allFocusable.length) {
      nextElement = allFocusable[idx + 1] || null;
      nextElement!.focus();
    }
  }
}
