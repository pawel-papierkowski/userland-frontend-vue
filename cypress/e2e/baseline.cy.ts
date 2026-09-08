// https://on.cypress.io/api

describe('Sanity Checks', () => {
  it('visits the app root url', () => {
    cy.visit('/')
    // Get text from footer that we can be sure it will always exist.
    cy.contains('footer', '© 2026 Paweł Papierkowski ')
  })
})
