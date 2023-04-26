// User should be admin
const user1Email = ''
const user1Pass = ''
const user1ID = ''

// User should NOT be admin
const user2Email = ''
const user2Pass = ''
const user2ID = ''

// A helper function to easily switch between users
// MUST BE USED as it clears cookies and authID between users
const loginByForm = (email, password) => {
  cy.session(['loginByForm', email], () => {
    cy.visit('http://localhost:3000/login')
    cy.get('#email-text-field').type(email)
    cy.get('#password-text-field').type(password)
    cy.get('#signin-button').click()
    cy.url().should('contain', '/profile')
  })
}

// NOTE!!! The <Protected> around pages in the App.js is making it so that Cypress
//         cannot reach certain pages. Removing it fixes the issue


describe('Landing Page', () => {
  it('loads properly', () => {
    cy.visit('localhost:3000')
  })

  it('sign in button', () => {
    cy.visit('localhost:3000')
    cy.contains('Sign in').click()
    cy.url().should('eq', 'http://localhost:3000/login')
  })

  it('sign up button', () => {
    cy.visit('localhost:3000')
    cy.contains('Sign up').click()
    cy.url().should('eq', 'http://localhost:3000/register')
  })
})

describe('Register', () => {
  it('invalid username', () => {
    cy.visit('localhost:3000/register')
    cy.get("#register-email-input").type('tester@mail.com')
    cy.get("#register-password-input").type('password')
    cy.get("#register-first-input").type('Tester')
    cy.get("#register-last-input").type('Man')
    cy.get("#register-username-input").type('andrewc')

    cy.get('#register-button').click()
    cy.url().should('eq', 'http://localhost:3000/register')
  })

  it('create new account', () => {
    cy.visit('localhost:3000/register')
    cy.get("#register-email-input").type('tester@mail.com')
    cy.get("#register-password-input").type('password')
    cy.get("#register-first-input").type('Tester')
    cy.get("#register-last-input").type('Man')
    cy.get("#register-username-input").type('testerman')

    cy.get('#register-button').click()
    cy.wait(500)
    cy.url().should('contain', '/profile')
  })

  it('sign out button', () => {
    // Sign out button on profile page is currently broken
    // We are forcec to go to report page and then sign out, not sure why
    cy.visit('localhost:3000/report')
    cy.wait(500)
    cy.get('#sign-out-button').click()
    cy.wait(500)
    cy.url().should('eq', 'http://localhost:3000/login')
  })
})

describe('Login', () => {
  it('inputting empty fields', () => {
    cy.visit('localhost:3000/login')
    
    // Try clicking signin button without any inputs
    cy.get('#signin-button').click()
    // User should stay on login page, since text fields were empty
    cy.url().should('eq', 'http://localhost:3000/login') 

    // Leave email text field blank
    cy.get('#password-text-field').type('password')
    cy.get('#signin-button').click()
    cy.url().should('eq', 'http://localhost:3000/login')

    // Leave password text field blank
    cy.get('#email-text-field').type(user1Email)
    cy.get('#password-text-field').clear()
    cy.get('#signin-button').click()
    cy.url().should('eq', 'http://localhost:3000/login')
  })

  it('logging in with existing account', () => {
    // Go to login page and fill in valid info
    cy.visit('localhost:3000/login')
    cy.get('#email-text-field').type(user1Email)
    cy.get('#password-text-field').type(user1Pass)
    cy.get('#signin-button').click()

    // Should continue onto profile page
    cy.url().should('eq', 'http://localhost:3000/profile/' + user1ID)

    // DO SIGN IN WITH GOOGLE TEST HERE
  })  
})

describe('Profile', () => {
  it('can change instruments', () => {
    cy.visit('http://localhost:3000/profile/' + user1ID);
    cy.get('#instrument-edit-button').click()
    cy.get('#Piano').click()
    cy.get('#instrument-confirm-button').click()
  })

  it('can change genres', () => {
    cy.visit('http://localhost:3000/profile/' + user1ID);
    cy.get('#genre-edit-button').click()
    cy.get('#Jazz').click()
    cy.get('#genre-confirm-button').click()
  })

  it("can navigate to friend's profile", () => {
    cy.visit('http://localhost:3000/profile/' + user1ID);
    cy.get('#friend-0').click()
    cy.url().should('not.eq', 'http://localhost:3000/profile/' + user1ID)
  })

  it("can navigate to session", () => {
    cy.visit('http://localhost:3000/profile/' + user1ID);
    cy.get('#session-0').click()
    cy.url().should('not.eq', 'http://localhost:3000/profile/' + user1ID)
  })

  it("can change photo", () => {
    cy.visit('http://localhost:3000/profile/' + user1ID);
    cy.get('#change-photo-button').click()
  })

  it("fails to send friend request", () => {
    cy.visit('http://localhost:3000/profile/' + user1ID);
    cy.get('#add-friend-input').type('username')
    cy.get('#add-friend-button').click()
  })
})

describe('Report', () => {
  
  it('report user fail', () => {
    cy.visit('localhost:3000/report')

    // Select report user
    cy.get('#report-selector-label').should('exist')
    cy.get('#report-selector').click()
    cy.get('#user-report').click()

    // Try to submit with empty fields
    cy.get("#submit-report-button").click()

    // Fill username box with incorrect username
    cy.get('#username-textbox').should('exist')
    cy.get('#username-textbox').type("junk name") // type incorrect username

    // Fill describe issue text box
    cy.get('#user-description').type("issue of description")

    // Try to submit with incorrect username
    cy.get("#submit-report-button").click()
  })

  it('report user success', () => {
    cy.visit('localhost:3000/report')

    // Select report user
    cy.get('#report-selector-label').should('exist')
    cy.get('#report-selector').click()
    cy.get('#user-report').click()

    // Fill describe issue text box
    cy.get('#user-description').type("Had an issue at his session")

    // Try to submit with incorrect username
    cy.get("#submit-report-button").click()

    // Fill in correct username, and submit
    cy.get('#username-textbox').type("mylesr") // type incorrect username
    cy.get("#submit-report-button").click()
    cy.wait(1000)
  })

  it('report bug fail', () => {
    cy.visit('localhost:3000/report')

    // Select report bug
    cy.get('#report-selector-label').should('exist')
    cy.get('#report-selector').click()
    cy.get('#bug-report').click()

    // Try to submit with empty fields
    cy.get("#submit-report-button").click()

    // Fill page box with incorrect username
    cy.get("#bug-page-textbox").type("junk page") // type incorrect username

    // Try to submit with missing field again
    cy.get("#submit-report-button").click()
  })

  it('report bug success', () => {
    cy.visit('localhost:3000/report')

    // Select report bug
    cy.get('#report-selector-label').should('exist')
    cy.get('#report-selector').click()
    cy.get('#bug-report').click()

    // Fill page box 
    cy.get("#bug-page-textbox").type("Login Page") // type incorrect username

    // Fill in description box
    cy.get("#bug-description").type("Couldn't log in!")

    // Try to submit with missing field again
    cy.get("#submit-report-button").click()
    cy.wait(1000)
  })
})

describe('Create Session', () => {
  it('visit page', () => {
    cy.visit('http://localhost:3000/create-session')
    cy.url().should('eq', 'http://localhost:3000/create-session')
  })

  it('create session failure', () => {
    cy.visit('http://localhost:3000/create-session')

    // FIll out fields
    cy.get('#title').type("Test Title")
    cy.get('#description').type("Test Description")
    cy.get('#address').type("Test Address")
    cy.get('#city').type("Test City")
    cy.get('#state').click()
    cy.contains("Tennessee").click()
    cy.get('#postal-code').type("02653")
    cy.get("#create-session-button").click()
  })

  it('create public session', () => {
    cy.visit('http://localhost:3000/create-session')
    
    cy.get('#select-privacy').click();
    cy.contains('Public').click();
    cy.wait(500)
  })

  it('create private session with instruments and invite only', () => {
    cy.visit('http://localhost:3000/create-session')

    // FIll out fields
    cy.get('#title').type("Test Title")
    cy.get('#description').type("Test Description")
    cy.get('#address').type("Test Address")
    cy.get('#city').type("Test City")
    cy.get('#state').click()
    cy.contains("Tennessee").click()
    cy.get('#postal-code').type("02653")
    cy.get('#select-privacy').click();
    cy.get('#friends-only-option').click();
    cy.get('#limit-members-checkbox').click();
    cy.get('#request-required-checkbox').click();
    cy.get('#instruments-checkbox').click();
    cy.get('#instruments-input').type('Saxophone');
    cy.get("#create-session-button").click()
    
    // NOTE !!!!!!!!!!
    // Having trouble clicking the checkboxes right now, not sure what the problem is
    // cy.contains('instruments-checkbox').click();
    // cy.contains("Request Required").click()
  })
})

describe('Session listings', () => {
  it('filtering', () => {
    cy.visit('http://localhost:3000/create-session')
    cy.get('#listings-button').click()
    cy.wait(500)
    cy.get('#friends-only-checkbox').click()
    cy.get('#free-spaces-checkbox').click()
    cy.get('#instruments-checkbox').click()
    cy.get('#select-instruments').click()
    cy.get('#Saxophone').click()
  })

  it('can click session', () => {
    cy.visit('http://localhost:3000')
    cy.get('#listings-button').click()
    cy.wait(500)
    cy.get('#session-0').click()
    cy.wait(500)
    cy.url().should('not.eq', 'http://localhost:3000/session-listings')
    cy.wait(500)

    cy.get('#request-join-button').click()
    cy.wait(500)

    cy.get('#host-card').click()
    cy.wait(500)

    cy.visit('http://localhost:3000')
    cy.get('#listings-button').click()
    cy.wait(500)
    cy.get('#session-4').click()
    cy.wait(500)
    cy.get('#invite-username-input').type('andrewc')
    cy.get('#invite-user-button').click()

    cy.visit('http://localhost:3000')
    cy.get('#listings-button').click()
    cy.wait(500)
    cy.get('#session-1').click()
    cy.wait(500)
    cy.get('#select-instrument').click()
    cy.wait(500)
    cy.get('#Saxophone').click()
    cy.wait(500)
    cy.get('#join-button').click()
    cy.wait(500)
  })
})

describe('Navbar', () => {
  it('can accept session invite', () => {
    cy.visit('http://localhost:3000')
    cy.wait(500)
    cy.get('#notifications-button').click()
  })
})

describe('Reset Password', () => {
  it('can reset password', () => {
    cy.visit('localhost:3000/reset-password')
    cy.get('#standard-basic').type('andrew@mail.com')
    cy.get('#reset-password-button').click()
  })
})

describe('Admin', () => {
  it('visiting as admin user', () => {
    // Navigate to admin page
    cy.visit('localhost:3000/admin')
    // User should then be on admin page
    cy.url().should('eq', 'http://localhost:3000/admin')
    cy.contains('Reported Users')
    cy.contains('Bug Reports')
  })

  // it('sign out button', () => {
  //   // Sign out button on profile page is currently broken
  //   // We are forcec to go to report page and then sign out, not sure why
  //   cy.visit('localhost:3000')
  //   cy.wait(500)
  //   cy.get('#sign-out-button').click()
  //   cy.wait(500)
  //   cy.url().should('eq', 'http://localhost:3000/login')
  // })
  //
  // it('visiting as non-admin user', () => {
  //   cy.get('#email-text-field').type(user2Email)
  //   cy.get('#password-text-field').type(user2Pass)
  //   cy.get('#signin-button').click()
  //   cy.wait(500)
  //   cy.visit('localhost:3000/admin')
  //   cy.wait(1000)
  // })
})

// Removing the protected from session-listings allows you to visit the page,
// but there is a bug. Whenever you refresh, it can't get get the userID, so it crashes,

