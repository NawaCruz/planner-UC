describe('Gestión de cursos', () => {
  it('carga cursos, crea uno nuevo y lo muestra en la lista', () => {
    cy.intercept('POST', '**/api/courses', {
      statusCode: 201,
      body: {
        course: {
          id: 2,
          code: 'QA101',
          name: 'Calidad de Software',
          cycle: 4,
          blocks_per_week: 2,
          max_sections: 2,
          kind: 'carrera',
          description: 'Curso creado por Cypress',
          is_active: true,
          created_at: '2026-06-08T12:00:00.000Z',
          updated_at: '2026-06-08T12:00:00.000Z',
        },
      },
    }).as('createCourse')

    let requestCount = 0
    cy.intercept('GET', '**/api/courses*', (req) => {
      requestCount += 1
      if (requestCount === 1) {
        req.reply({
          statusCode: 200,
          body: {
            courses: [
              {
                id: 1,
                code: 'CS101',
                name: 'Introduccion a la Programacion',
                cycle: 1,
                blocks_per_week: 3,
                max_sections: 2,
                kind: 'carrera',
                description: 'Curso base',
                is_active: true,
                created_at: '2026-06-01T10:00:00.000Z',
                updated_at: '2026-06-01T10:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
          },
        })
      } else {
        req.reply({
          statusCode: 200,
          body: {
            courses: [
              {
                id: 2,
                code: 'QA101',
                name: 'Calidad de Software',
                cycle: 4,
                blocks_per_week: 2,
                max_sections: 2,
                kind: 'carrera',
                description: 'Curso creado por Cypress',
                is_active: true,
                created_at: '2026-06-08T12:00:00.000Z',
                updated_at: '2026-06-08T12:00:00.000Z',
              },
              {
                id: 1,
                code: 'CS101',
                name: 'Introduccion a la Programacion',
                cycle: 1,
                blocks_per_week: 3,
                max_sections: 2,
                kind: 'carrera',
                description: 'Curso base',
                is_active: true,
                created_at: '2026-06-01T10:00:00.000Z',
                updated_at: '2026-06-01T10:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 2, totalPages: 1 },
          },
        })
      }
    }).as('coursesRequest')

    cy.seedAdminSession()
    cy.visit('/courses')
    cy.wait('@coursesRequest')

    cy.contains('Introduccion a la Programacion').should('be.visible')
    cy.get('#code').type('QA101')
    cy.get('#name').type('Calidad de Software')
    cy.get('#cycle').type('{selectall}4')
    cy.get('#blocks_per_week').type('{selectall}2')
    cy.get('#max_sections').type('{selectall}2')
    cy.get('#description').type('Curso creado por Cypress')
    cy.contains('button', 'Crear curso').click()

    cy.wait('@createCourse')
    cy.wait('@coursesRequest')
    cy.contains('Curso creado correctamente.').should('be.visible')
    cy.contains('Calidad de Software').should('be.visible')
    cy.contains('QA101').should('be.visible')
  })
})
