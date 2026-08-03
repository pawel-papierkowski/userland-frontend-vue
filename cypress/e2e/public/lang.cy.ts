// ////////////////////////////////////////////////////////////////////////////
// Language Switcher E2E Tests

import { locstLang } from '@/code/data/app/storage.ts';

/** Selector for the language button with given code. */
function getLangButton(lang: string) {
  return cy.getByTestId('lang_' + lang);
}

// ////////////////////////////////////////////////////////////////////////////

describe('Language Switcher', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstLang);
  });

  it('shows English texts by default', () => {
    // Arrange&Act: Visit home page with forced English language.
    cy.visitUserLand('/');

    // Assert: Footer texts are in English.
    cy.contains('footer', 'Frontend repository');
  });

  it('changes to Polish when Polish flag is clicked', () => {
    // Arrange: Visit home page with forced English language.
    cy.visitUserLand('/');

    // Act: Click the Polish flag button.
    getLangButton('pl').click();

    // Assert: Footer texts are now in Polish.
    cy.contains('footer', 'Repozytorium frontendu');

    // Assert: Chosen language is saved to local storage.
    cy.window()
      .then((win) => win.localStorage.getItem(locstLang))
      .should('eq', 'pl');
  });

  it('changes back to English when English flag is clicked', () => {
    // Arrange: Visit home page and switch to Polish first.
    cy.visitUserLand('/');
    getLangButton('pl').click();
    cy.contains('footer', 'Repozytorium frontendu');

    // Act: Click the English flag button.
    getLangButton('en').click();

    // Assert: Footer texts are back to English.
    cy.contains('footer', 'Frontend repository');

    // Assert: Chosen language is saved to local storage.
    cy.window()
      .then((win) => win.localStorage.getItem(locstLang))
      .should('eq', 'en');
  });

  it('keeps selected language after page reload', () => {
    // Arrange: Visit home page and switch to Polish.
    cy.visitUserLand('/');
    getLangButton('pl').click();
    cy.contains('footer', 'Repozytorium frontendu');

    // Act: Reload the page.
    cy.reload();

    // Assert: Footer texts are still in Polish after reload.
    cy.contains('footer', 'Repozytorium frontendu');
  });
});
