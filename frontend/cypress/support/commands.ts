/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Cypress {
    interface Chainable {
      seedAdminSession(): Chainable<void>
    }
  }
}

Cypress.Commands.add('seedAdminSession', () => {
  cy.session('admin-session', () => {
    cy.visit('/login')
    cy.get('#email').type('admin@example.com')
    cy.get('#password').type('password123')
    cy.contains('button', 'Iniciar sesión').click()
    cy.url().should('include', '/dashboard')
  })
})

export {}
