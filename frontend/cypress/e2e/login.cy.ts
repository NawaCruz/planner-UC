describe('Login y navegación', () => {
  it('permite iniciar sesión y redirige al dashboard', () => {
    cy.visit('/login')

    cy.contains('Planner UC').should('be.visible')
    cy.get('input[type="email"]').type('admin@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Iniciar sesión').click()

    cy.url().should('include', '/dashboard')
    cy.contains('Bienvenido').should('be.visible')
    cy.contains('Administrador').should('be.visible')
  })
})
