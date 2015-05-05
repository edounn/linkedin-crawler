// Initializations and Setup
//-------------------------------------------------------------------------
var casper = require('casper').create({
  // Prints debug information to console
  verbose: true,
  // Only debug level messages are printed
  logLevel: "debug",
  pageSettings: {
    loadImages: true,
    loadPlugins: true,
  }
});

// Globals
var email = '';
var password = '';
var profilePictureDirectory = 'profile-pictures/';

// Evaluating Command Line Arguments
if(casper.cli.has(0) && casper.cli.has(1)) {
  var email = casper.cli.get(0);
  var password = casper.cli.get(1);
  casper.echo('Login Email = ' + email,'GREEN_BAR');
  casper.echo('Login password = protected', 'GREEN_BAR');
}

// Error Handling
//-------------------------------------------------------------------------

// http://docs.casperjs.org/en/latest/events-filters.html#remote-message
casper.on("remote.message", function(msg) {
  this.echo("Console: " + msg);
});

// http://docs.casperjs.org/en/latest/events-filters.html#page-error
casper.on("page.error", function(msg, trace) {
  this.echo("Error: " + msg);
    // maybe make it a little fancier with the code from the PhantomJS equivalent
  });

// http://docs.casperjs.org/en/latest/events-filters.html#resource-error
// -- Intentionally Silencing Resource Errors Here --
/*
casper.on("resource.error", function(resourceError) {
  this.echo("ResourceError: " + JSON.stringify(resourceError, undefined, 4));
});
*/

// http://docs.casperjs.org/en/latest/events-filters.html#page-initialized
casper.on("page.initialized", function(page) {
    // CasperJS doesn't provide `onResourceTimeout`, so it must be set through 
    // the PhantomJS means. This is only possible when the page is initialized
    page.onResourceTimeout = function(request) {
      console.log('Response Timeout (#' + request.id + '): ' + JSON.stringify(request));
    };
  });

// Custom Functions
//-------------------------------------------------------------------------

// Login Function
casper.loginLinkedIn = function(loginEmail, loginPassword) {
  if(this.exists('form#login')){
    this.fillSelectors('form#login', {
      'input#session_key-login': loginEmail,
      'input#session_password-login': loginPassword
    }, true);
  } 
  else {
    this.echo('LinkedIn login form not found on page', 'ERROR');
  }

  // Looing for 'identity' id which relates to small profile preview on main page. Then check the tite.
  this.waitForSelector('#identity', function() {
    if(this.getTitle() == 'Welcome! | LinkedIn'){
      this.echo('Successfully logged in to LinkedIn', 'GREEN_BAR');
    }
    else {
      this.echo('Login unsuccessful', 'ERROR');
    }
  });
};


// Returns an array of employee objects
casper.getUserDataOnPage = function() {

  return this.evaluate(function() {

    var tempObjects = [];

    var userNames = $('ol#results li.mod').find('a.title').map(function() { return $(this).text() }).get();

    var userImgSrcs= $('ol#results li.mod').find('img').map(function() { return this.src }).get();

    if(userNames.length === userImgSrcs.length) {
      for(var i = 0; i < userImgSrcs.length; i++){
        tempObjects.push({name: userNames[i], img: userImgSrcs[i]}) 
      }
    }
    else {
      console.log('Mismatch in user/image count');
      console.log('Names: ' + userNames.length);
      console.log('Srcs: ' + userImgSrcs.length);
    }

    return tempObjects;
  });
};

// Pagination - uses recursion to click 'Next' after completing getUserDataOnPage()

casper.nextPage = function(empl) {

  this.waitForSelector('ol#results', function() {

    this.echo('Employee list found', 'GREEN_BAR');

    empl.push(this.getUserDataOnPage());

    this.echo(empl, 'GREEN_BAR');
  });

  this.then(function() {
   if(this.visible('#results-pagination a[rel=next]')) {

      this.thenClick('#results-pagination a[rel=next]');

      this.wait(3000);

      this.then(this.nextPage());
    }
    else {
      this.echo('END', 'ERROR');
    };
  });
};

// Starting Casper Actions
//-------------------------------------------------------------------------

casper.start('https://linkedin.com').then(function() {
  this.loginLinkedIn(email, password);
  email = '';
  password = '';
});

// Opening URL to company employee results
casper.then(function() {
  this.open('https://www.linkedin.com/vsearch/p?f_CC=167212&trk=rr_connectedness');
});

casper.then(function() {

  // Stores objects with name and picture
  var employees = [];
  var tempThings = this.getUserDataOnPage();
  this.echo(tempThings);
  
});

casper.run();
