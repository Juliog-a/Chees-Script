describe('Flujo de registro de Usuario', () => {

  //PRUEBAS DE REGISTRO
  it('Fallo porque solo se permite Gmail y Outlook', () => {
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="username"]').type('UsuarioTest');
    cy.get('input[name="email"]').type('nuevotest@MALICIOSO.com');
    cy.get('input[name="password"]').type('contraseñaSegura123_');
    cy.get('input[name="confirmPassword"]').type('contraseñaSegura123_');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/perfil');
    cy.contains('Solo se permiten correos de Gmail, Outlook y Alum.us.es.');
  });

  it('Fallo por contraseña insegura', () => {
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="username"]').type('UsuarioTest'); 
    cy.get('input[name="email"]').type('nuevotest@gmail.com'); 
    cy.get('input[name="password"]').type('contraseñamala');
    cy.get('input[name="confirmPassword"]').type('contraseñamala');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/perfil');
    cy.contains('La contraseña debe tener al menos 8 caracteres, incluir una letra, un número y un carácter especial.');
  });

  it('Fallo por contraseña que no coinciden', () => {
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="username"]').type('UsuarioTest'); 
    cy.get('input[name="email"]').type('nuevotest@gmail.com'); 
    cy.get('input[name="password"]').type('contraseñaSegura123_');
    cy.get('input[name="confirmPassword"]').type('contraseñamala');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/perfil');
    cy.contains('Las contraseñas no coinciden');
  });

  it('Fallo que no se permite repetir email', () => {
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="username"]').type('UsuarioTest'); 
    cy.get('input[name="email"]').type('nuevo@outlook.com'); 
    cy.get('input[name="password"]').type('contraseñaSegura123_');
    cy.get('input[name="confirmPassword"]').type('contraseñaSegura123_');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/perfil');
    cy.contains('El email ya está registrado.');
  });

  it('Fallo que no se permite repetir nombre de usuario', () => {
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="username"]').type('nuevoUsuario'); 
    cy.get('input[name="email"]').type('nuevotest@gmail.com'); 
    cy.get('input[name="password"]').type('contraseñaSegura123_');
    cy.get('input[name="confirmPassword"]').type('contraseñaSegura123_');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/perfil');
    cy.contains('El usuario ya existe.');
  });

  it('Correcto y  permitir registrarse con Gmail', () => {
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="username"]').type('UsuarioTest'); 
    cy.get('input[name="email"]').type('nuevotest@gmail.com'); 
    cy.get('input[name="password"]').type('contraseñaSegura123_');
    cy.get('input[name="confirmPassword"]').type('contraseñaSegura123_');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/perfil', { timeout: 12000 }); // Espera hasta 12 segundos
  });
});


describe('Flujo de Login de Usuario', () => {

  //PRUEBAS DE LOGIN
  it('Fallo contraseñas invalidas', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="username"]').type('UsuarioTest');
    cy.get('input[name="password"]').type('contraseñamala');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="login-button"]').click();
    cy.wait(4000); // Espera 4 segundos
    cy.url().should('not.include', '/perfil');
    cy.contains('Credenciales incorrectas');
  });

  it('Correcto permitir a un usuario iniciar sesión', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[name="username"]').type('UsuarioTest'); 
    cy.get('input[name="password"]').type('contraseñaSegura123_');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="login-button"]').click();
    cy.wait(6000)
    cy.url().should('include', '/perfil', { timeout: 12000 }); // Espera hasta 12 segundos
  });

});


describe('Rutas protegidas - redirección al login si no estás autenticado', () => {
  const baseUrl = 'http://localhost:5173';
  const rutasProtegidas = [
    '/perfil',
    '/desafios',
    '/terminos',
    '/politica',
    '/contacto',
    '/formulario-contacto',
    '/blog',
    '/teoria/3',
    '/pistas/3', 
    '/desafio/3',
    '/feedback/3',
  ];

  rutasProtegidas.forEach((ruta) => {
    it(`No permite acceder a ${ruta} si no estás logueado`, () => {
      cy.clearLocalStorage();
      cy.clearCookies();
      cy.visit(`${baseUrl}${ruta}`);
      cy.url().should('include', '/login');
    });
  });
});


describe('Flujo de navegación de usuario', () => {
    //PRUEBAS DE NAVEGACIÓN
    it('debería navegar entre todas las páginas correctamente', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest'); 
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="login-button"]').click();
      cy.wait(3000);
      cy.url().should('include', '/perfil');
      cy.wait(3000); 
      cy.get('nav').contains('Blog').click();
      cy.url().should('include', '/blog');
      cy.wait(3000); 
      cy.get('nav').contains('Desafíos').click();
      cy.url().should('include', '/desafios');
      cy.wait(3000); 
      cy.get('nav').contains('Contacto').click();
      cy.url().should('include', '/contacto');
      cy.wait(3000); 
    });
  });



  describe('Formulario de contacto funcional', () => {
    //PRUEBAS DE FORMULARIO DE CONTACTO
    it('Fallo Captcha no valido', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="login-button"]').click();
      cy.wait(5000);  
      // Visita la ruta del formulario
      cy.visit('http://localhost:5173/contacto');
      cy.get('[data-testid="form-button"]').click();
      cy.wait(3000);  
      cy.url().should('include', '/formulario-contacto');
      cy.get('input[name="email"]').type('nuevotest@gmail.com');
      cy.get('textarea[name="comentario"]').type('Este es un comentario de prueba.');
        cy.get('label')
        .contains('¿Cuánto es')
        .invoke('text')
        .then((texto) => {
          const numeros = texto.match(/\d+/g);
          const resultado = parseInt(numeros[0]) + parseInt(numeros[1]);
          cy.get('input[name="captcha"]').type('999');
                });
      cy.get('button[type="submit"]').click();
      cy.contains('Captcha incorrecto. Inténtalo de nuevo.').should('be.visible');
    });


    it('Envío del formulario de contacto con datos válidos', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="login-button"]').click();
      cy.wait(5000);  
      // Visita la ruta del formulario
      cy.visit('http://localhost:5173/contacto');
      cy.get('[data-testid="form-button"]').click();
      cy.wait(3000);  
      cy.url().should('include', '/formulario-contacto');
      cy.get('input[name="email"]').type('nuevotest@gmail.com');
      cy.get('textarea[name="comentario"]').type('Este es un comentario de prueba.');
        cy.get('label')
        .contains('¿Cuánto es')
        .invoke('text')
        .then((texto) => {
          const numeros = texto.match(/\d+/g);
          const resultado = parseInt(numeros[0]) + parseInt(numeros[1]);
          cy.get('input[name="captcha"]').type(resultado.toString());
        });
      cy.get('button[type="submit"]').click();
      cy.contains('Mensaje enviado correctamente.').should('be.visible');
    });
  }); 
  

  describe('Blog - Publicaciones, Comentarios, Likes y Eliminación', () => {
//TEST RELACIONADOS CON BLOG
    before(() => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="login-button"]').click();
      cy.wait(3000);
    }); 
  
    it('Creación de una nueva publicación', () => {
      cy.visit('http://localhost:5173/blog');
      cy.contains('Crear Publicación').click();
  
      cy.get('input[placeholder="Título"]').type('Post de prueba Cypress');
      cy.get('textarea[placeholder="Contenido"]').type('Este es un post de prueba.');
      cy.get('input[placeholder="URL de imagen (Opcional)"]').type(
        'https://res.cloudinary.com/dvdq9ci8h/image/upload/v1743354122/x5spvrgsgadptzczdhny.webp'
      );
  
      cy.contains('Publicar').click();
      cy.wait(3000);
        cy.get('[data-testid^="publicacion-"]').first().invoke('attr', 'data-testid').then((testId) => {
        const id = testId.split('-')[1];
        Cypress.env('idPublicacionCreada', id);
      });
    });
   
    it('Agregar un comentario a la publicación', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('[data-testid="login-button"]').click();
      cy.wait(3000);
      cy.visit('http://localhost:5173/blog');
      cy.wait(2000);
  
      const id = Cypress.env('idPublicacionCreada');
      cy.get(`[data-testid="publicacion-${id}"]`).scrollIntoView().within(() => {
        cy.get('textarea[placeholder="Escribe un comentario..."]').type('Este es un comentario desde Cypress');
        cy.contains('Comentar').click();
        cy.contains('Este es un comentario desde Cypress').should('exist');
      });
    });
  
    it('Dar like a la publicación', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('[data-testid="login-button"]').click();
      cy.wait(2000);
      cy.visit('http://localhost:5173/blog');
      cy.wait(2000);
      cy.url().should('not.include', '/login');
      const id = Cypress.env('idPublicacionCreada');
      cy.get(`[data-testid="publicacion-${id}"]`).scrollIntoView().within(() => {
        cy.get('button').contains('🤍').click();
        cy.contains('❤️').should('exist');
        cy.wait(4000);
      });
    });
  
    it('Eliminar la publicación creada', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="login-button"]').click();
      cy.wait(3000);
      cy.visit('http://localhost:5173/blog');
      cy.wait(3000);
  
      const id = Cypress.env('idPublicacionCreada');
      cy.get(`[data-testid="publicacion-${id}"]`).scrollIntoView().within(() => {
        cy.contains('Eliminar').click();
      });
  
      cy.wait(3000);
      cy.get(`[data-testid="publicacion-${id}"]`).should('not.exist');
      cy.wait(3000);
    });
  
  });
    

  
  describe('Desafíos - Filtros por Dificultad y Categoría', () => {

      //PRUEBAS DE FUNCIONAMIENTO DEL FILTRO DE DESAFIOS

    beforeEach(() => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="login-button"]').click();
      cy.url().should('include', '/perfil');
    });
  
    const dificultades = ['Principiante', 'Intermedio', 'Avanzado', 'Experto'];
    dificultades.forEach((nivel) => {
      it(`Filtra correctamente desafíos por dificultad "${nivel}"`, () => {
        cy.visit('http://localhost:5173/desafios');
        cy.contains(nivel).click();
        cy.wait(1000);
  
        cy.get('[data-testid^="desafio-card-"]').each(($el) => {
          cy.wrap($el).should('contain.text', nivel);
        });
      });
    });
  
    const categorias = ['XSS', 'Cifrado', 'Inyección SQL', 'Depuración'];
    categorias.forEach((categoria) => {
      it(`Filtra correctamente desafíos por categoría "${categoria}"`, () => {
        cy.visit('http://localhost:5173/desafios');
        cy.contains('☰ Temáticas').click();
        cy.contains(categoria).click();
        cy.wait(1000);
  
        cy.get('[data-testid^="desafio-card-"]').each(($el) => {
          cy.wrap($el)
          .find(`[data-testid^="categoria-"]`)
          .should('contain.text', categoria);
        });
      });
    });

    it('Da like a un desafío de nivel Principiante y categoría Depuración', () => {
      cy.visit('http://localhost:5173/desafios');
      cy.contains('Principiante').click();
      cy.contains('☰ Temáticas').click();
      cy.contains('Depuración').click();
      cy.wait(1000);
  
      cy.get('[data-testid^="desafio-card-"]').first().within(() => {
        cy.get('button').contains('🤍').click(); 
        cy.contains('❤️').should('exist'); 
        cy.get(`[data-testid^="categoria-"]`).should('contain.text', 'Depuración');
      });
    });
  
    it('Filtra desafíos por "Favoritos"', () => {
      cy.visit('http://localhost:5173/desafios');
      cy.contains('❤️ Favoritos').click();
      cy.wait(1000);
  
      cy.get('[data-testid^="desafio-card-"]').should('exist');
    });
  

  
    it('Filtra desafíos por Favoritos + Principiante + Depuración simultáneamente', () => {
      cy.visit('http://localhost:5173/desafios');
      cy.contains('❤️ Favoritos').click();
      cy.contains('Principiante').click();
      cy.contains('☰ Temáticas').click();
      cy.contains('Depuración').click();
      cy.wait(1000);
  
      cy.get('[data-testid^="desafio-card-"]').each(($el) => {
        cy.wrap($el).should('contain.text', 'Principiante');
        cy.wrap($el).find(`[data-testid^="categoria-"]`).should('contain.text', 'Depuración');
        cy.wrap($el).find('button').should('contain.text', '❤️');
      });
    });

    //PRUEBAS DE FUNCIONAMIENTO DEL FEEDBACK DE DESAFIOS


    it('Envía correctamente un formulario de feedback de desafío', () => {
      cy.visit('http://localhost:5173/feedback/4');
          cy.contains('Formulario de Feedback');
          cy.get('input[readOnly]').should('not.have.value', 'Cargando...');
          cy.get('textarea').type('Este desafío fue muy útil para entender la lógica.');
          cy.get('[data-testid="puntuacion-button"]').eq(3).click();
          cy.get('label')
          .contains('¿Cuánto es')
          .invoke('text')
          .then((texto) => {
            const numeros = texto.match(/\d+/g);
            const resultado = Number(numeros[0]) + Number(numeros[1]) - Number(numeros[2]);
            cy.get('input[name="captcha"]').type(resultado.toString());
        });
          cy.get('button[type="submit"]').click();
          cy.contains('Feedback enviado correctamente.');
      cy.url().should('include', '/desafios');
    });
    
   
});

    //PRUEBAS DE FUNCIONAMIENTO DE RESOLVER DESAFIOS

    describe('Resolución de un desafío', () => {
      // Mensajes esperados devueltos por el sistema
      const mensajeIncorrecta = 'Incorrecto. Inténtalo de nuevo.';
      const mensajeCorrecta = '¡Correcto! Has resuelto el desafío.';
      const mensajeRepetida = 'Ya has resuelto este desafío antes.';
    
      // Respuestas que el usuario debe escribir
      const inputValueIncorrecto = 'respuesta_mal';
      const inputValueCorrecto = 'Este es el mensaje';
    
      const url = 'http://localhost:5173/desafio/1';
     
      beforeEach(() => {
        cy.visit('http://localhost:5173/login');
        cy.get('input[name="username"]').type('UsuarioTest');
        cy.get('input[name="password"]').type('contraseñaSegura123_');
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="login-button"]').click();
        cy.url().should('include', '/perfil');
      });
    
      it('Falla al resolver el desafío con una respuesta incorrecta', () => {
        cy.visit(url);
        cy.get('input[type="text"]').clear().type(inputValueIncorrecto);
        cy.get('button').contains('Comprobar').click();
        cy.contains(mensajeIncorrecta);
      });
    
      it('Resuelve correctamente el desafío con la respuesta correcta', () => {
        cy.visit(url);
        cy.get('input[type="text"]').clear().type(inputValueCorrecto);
        cy.get('button').contains('Comprobar').click();
        cy.contains(mensajeCorrecta);
      });
    
      it('Detecta que el desafío ya está resuelto si se vuelve a intentar', () => {
        cy.visit(url);
        cy.get('input[type="text"]').clear().type(inputValueCorrecto);
        cy.get('button').contains('Comprobar').click();
        cy.contains(mensajeRepetida);
      });


      it('Muestra el trofeo de Julio César en el perfil tras resolver el desafío', () => {
        cy.visit('http://localhost:5173/perfil');
        cy.wait(6000);
        cy.contains('Trofeos').scrollIntoView();
        cy.wait(2000);
        cy.contains('Has descifrado el método que usaba Julio Cesar!').should('be.visible');
      });

    });
     


 

    describe('Pruebas de diseño', () => {


    //PRUEBAS DE DISEÑO
    it('debería mostrar el formulario correctamente en dispositivos móviles (iPhone 6)', () => {
      cy.viewport('iphone-6'); 
      cy.visit('http://localhost:5173/register');
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('debería mostrar el formulario correctamente en tabletas (iPad)', () => {
      cy.viewport('ipad-2'); 
      cy.visit('http://localhost:5173/register');
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('debería adaptarse a pantallas pequeñas (320x480)', () => {
      cy.viewport(320, 480); 
      cy.visit('http://localhost:5173/register');
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
    
    it('debería adaptar el diseño cuando el tamaño de la pantalla cambia', () => {
      cy.visit('http://localhost:5173/register');
      cy.viewport(1280, 800); 
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
    
      cy.viewport(768, 1024); 
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
    
      cy.viewport(320, 480);
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
    });
    
  });

    
  describe('Prueba de modificacion de contraseña', () => {
 //PRUEBAS RELACIONADAS CON LA SEGURIDAD

      it('Fallo politica de contraseña segura', () => {
        cy.visit('http://localhost:5173/login');
        cy.get('input[name="username"]').type('UsuarioTest');
        cy.get('input[name="password"]').type('contraseñaSegura123_');
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="login-button"]').click();
        cy.wait(5000);
          cy.visit('http://localhost:5173/perfil'); 
          cy.get('[data-testid="change-button"]').click();
          cy.get('.bg-black').should('exist').should('be.visible');
          cy.get('input[placeholder="Contraseña Antigua"]').type('contraseñaSegura123_');
          cy.get('input[placeholder="Nueva Contraseña"]').type('nuevaContrasenainsegura');
          cy.get('input[placeholder="Confirmar Nueva Contraseña"]').type('nuevaContrasenainsegura');
          cy.contains('Confirmar').click();
          cy.contains('La contraseña debe tener al menos 8 caracteres, incluir una letra, un número y un carácter especial.').should('exist');
      });

      it('Fallo las contraseñas no coinciden', () => {
        cy.visit('http://localhost:5173/login');
        cy.get('input[name="username"]').type('UsuarioTest');
        cy.get('input[name="password"]').type('contraseñaSegura123_');
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="login-button"]').click();
        cy.wait(5000);
          cy.visit('http://localhost:5173/perfil'); 
          cy.get('[data-testid="change-button"]').click();
          cy.get('.bg-black').should('exist').should('be.visible');
          cy.get('input[placeholder="Contraseña Antigua"]').type('contraseñaSegura123_');
          cy.get('input[placeholder="Nueva Contraseña"]').type('nuevaContrasenainsegura');
          cy.get('input[placeholder="Confirmar Nueva Contraseña"]').type('nuevaContrasenadistintarda');
          cy.contains('Confirmar').click();
          cy.contains('Las nuevas contraseñas no coinciden.').should('exist');
      });

      it('Fallo la contraseña nueva no puede ser igual a la anterior', () => {
        cy.visit('http://localhost:5173/login');
        cy.get('input[name="username"]').type('UsuarioTest');
        cy.get('input[name="password"]').type('contraseñaSegura123_');
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="login-button"]').click();
        cy.wait(5000);
          cy.visit('http://localhost:5173/perfil');
          cy.get('[data-testid="change-button"]').click();
          cy.get('.bg-black').should('exist').should('be.visible');
          cy.get('input[placeholder="Contraseña Antigua"]').type('contraseñaSegura123_');
          cy.get('input[placeholder="Nueva Contraseña"]').type('contraseñaSegura123_');
          cy.get('input[placeholder="Confirmar Nueva Contraseña"]').type('contraseñaSegura123_');
          cy.contains('Confirmar').click();
          cy.contains('La nueva contraseña no puede ser igual a la anterior.').should('exist');
      }); 

      it('Permitir a un usuario cambiar su contraseña', () => {
        cy.visit('http://localhost:5173/login');
        cy.get('input[name="username"]').type('UsuarioTest');
        cy.get('input[name="password"]').type('contraseñaSegura123_');
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="login-button"]').click();
        cy.wait(5000); 
        cy.visit('http://localhost:5173/perfil');
        cy.get('[data-testid="change-button"]').click(); 
        cy.get('[data-testid="password-modal"]').should('exist').should('be.visible');
        cy.get('input[placeholder="Contraseña Antigua"]').type('contraseñaSegura123_');
        cy.get('input[placeholder="Nueva Contraseña"]').type('nuevaContrasena456_');
        cy.get('input[placeholder="Confirmar Nueva Contraseña"]').type('nuevaContrasena456_');
        cy.contains('Confirmar').click();
        cy.wait(5000);
        cy.get('[data-testid="password-modal"]').should('not.exist');
        cy.url().should('include', '/perfil');
    });
    

      it('Fallo ya que la contraseña a sido cambiada', () => {
        cy.visit('http://localhost:5173/login');
        cy.get('input[name="username"]').type('UsuarioTest'); 
        cy.get('input[name="password"]').type('contraseñaSegura123_');
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="login-button"]').click();
        cy.wait(5000); // Espera 5 segundos
        cy.url().should('not.include', '/perfil');
        cy.contains('Credenciales incorrectas'); 
      });
 
      it('Correcto permitir a un usuario iniciar sesión', () => {
        cy.visit('http://localhost:5173/login');
        cy.get('input[name="username"]').type('UsuarioTest'); 
        cy.get('input[name="password"]').type('nuevaContrasena456_');
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="login-button"]').click();
        cy.wait(6000)
        cy.url().should('include', '/perfil', { timeout: 12000 }); // Espera hasta 12 segundos
      });
    

    });


      describe('Prueba de borrar cuenta', () => {
    it('debería permitir a un usuario eliminar su cuenta', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('nuevaContrasena456_');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="login-button"]').click();
      cy.wait(5000);
        cy.url().should('include', '/perfil');
        cy.get('[data-testid="borrar-button"]').click(); 
        cy.get('.bg-yellow-200') 
            .should('exist')
            .should('be.visible');
        cy.wait(5000);
        cy.get('[data-testid="confirmation-input"]').type('CONFIRMO');
        cy.wait(5000);
        cy.contains('Confirmar Eliminación').click();
        cy.wait(5000);
        cy.url().should('include', '/login');
        cy.window().then((window) => {
            const token = window.localStorage.getItem('accessToken');
            expect(token).to.be.null; 
        });
    });


    it('Fallo ya que la cuenta ha sido eliminada', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest'); 
      cy.get('input[name="password"]').type('nuevaContrasena456_');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="login-button"]').click();
      cy.wait(5000); // Espera 5 segundos
      cy.url().should('not.include', '/perfil');
      cy.contains('Credenciales incorrectas'); 
    });

  });



  describe('Pruebas relacionadas con la seguridad', () => {
    //PRUEBAS DE SEGURIDAD
    it('Se registra para probrobar las otras pruebas', () => {
      cy.visit('http://localhost:5173/register');
      cy.get('input[name="username"]').type('UsuarioTest'); 
      cy.get('input[name="email"]').type('nuevotest@gmail.com'); 
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('input[name="confirmPassword"]').type('contraseñaSegura123_');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/perfil', { timeout: 6000 }); 
    });


    //Simula token vacio
    it('Token vacio', () => {
      cy.visit('http://localhost:5173/perfil');
      cy.clearLocalStorage();
      cy.url().should('include', '/login');
    });
  
    it('Debería bloquear el login después de múltiples intentos fallidos', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaIncorrecta');
      for (let i = 0; i < 2; i++) {
        cy.get('[data-testid="login-button"]').click();
        cy.wait(5000); // Espera 5 segundos
      }
      cy.contains('Demasiados intentos fallidos. Inténtalo en 3 minutos.');
    });
  
 
    it('Fallo ya que está bloqueado hasta dentro de unos minutos', () => {
      cy.visit('http://localhost:5173/login');
      cy.get('input[name="username"]').type('UsuarioTest');
      cy.get('input[name="password"]').type('contraseñaSegura123_');
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/perfil', { timeout: 5000 });
      cy.contains('Demasiados intentos fallidos. Inténtalo en 3 minutos.');
    });
  
  });