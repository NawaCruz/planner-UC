describe('Schedule generator unhappy path', () => {
  it('muestra un mensaje de error cuando falla el backend', () => {
    cy.intercept('GET', 'http://localhost:8000/api/scheduling-demo', {
      statusCode: 500,
      body: { error: 'Backend caído' },
    }).as('scheduleError')

    cy.seedAdminSession()
    cy.visit('/schedule-generator')
    cy.wait('@scheduleError')

    cy.contains('No se pudo cargar el horario').should('be.visible')
    cy.contains('La API respondio con 500.').should('be.visible')
  })
})
