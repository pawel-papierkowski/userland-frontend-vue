// https://on.cypress.io/api

describe('Sanity Checks', () => {
  it('visits the app root url', () => {
    cy.visit('/')
    // Get something from footer.
    cy.contains('footer', '© 2026 Paweł Papierkowski ')
  })
})
