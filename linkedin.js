// Initializations and Setup
//-------------------------------------------------------------------------
var casper = require('casper').create({
  // Prints debug information to console
  verbose: true,
  // Only debug level messages are printed
  logLevel: "info",
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

// Silencing console errors because linkedin has too god damn many

/*
casper.on("remote.message", function(msg) {
  this.echo("Console: " + msg);
});
*/

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

casper.renderJSON = function(obj) {
  return this.echo(JSON.stringify(obj, null, '  '));
};

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
casper.getUserDataOnPageNonPremium = function() {

  return this.evaluate(function() {

    // ONLY FINDING EMPLOYEES WHOSE NAMES ARE VISIBLE TO NON-PREMIUM ACCOUNT (I.E. MINE)
    var pageUsers = [];
    var userNames= [];
    var userImgSrcs = [];

    $('ol#results li.mod').map(function() {
      var name = $(this).find('a.title').text();
      var imgElement = $(this).find('a>img');


      if((name !== 'LinkedIn Member') && ( $(imgElement).not('ghost'))) {
        userNames.push(name);
        userImgSrcs.push($(imgElement).attr('src'));
      }
    }).get()

    console.log(userNames.toString());
    console.log(userImgSrcs.toString());

    if(userNames.length === userImgSrcs.length) {
      for(var i = 0; i < userImgSrcs.length; i++){
        pageUsers.push({name: userNames[i], img: userImgSrcs[i]}) 
      }
      return pageUsers;
    }
    else {
      console.log('Mismatch in user/image count');
      console.log('Names: ' + userNames.length);
      console.log('Srcs: ' + userImgSrcs.length);
    }
  });
};

// Returns all employees if the login account has LinkedIn premium
casper.getUserDataOnPageWithPremium = function(empl) {

  return this.evaluate(function() {

    // RETURNS USERS WITH PREMIUM TURNED ON - ALL

    var userNames = $('ol#results li.mod').find('a.title').map(function() { return $(this).text() }).get();

    var userImgSrcs = $('ol#results li.mod').find('img').map(function() { return this.src }).get();
    if(userNames.length && userImgSrcs.length) {
      if(userNames.length === userImgSrcs.length) {
        for(var i = 0; i < userImgSrcs.length; i++){
          tempObjects.push({name: userNames[i], img: userImgSrcs[i]}) 
        }
        return tempObjects;
      }
      else {
        console.log('Mismatch in user/image count');
        console.log('Names: ' + userNames.length);
        console.log('Srcs: ' + userImgSrcs.length);
      }
    }
  });
};

// Pagination - uses recursion to click 'Next' after completing getUserDataOnPage()

function nextPage (empl, n) {

  casper.waitForSelector('ol#results', function() {

    casper.echo('Page ' + n, 'GREEN_BAR');

    // Scraping the page's content for names and image URLS
    empl.push(casper.getUserDataOnPageNonPremium());
    this.echo(casper.renderJSON(empl));

    if(casper.visible('#results-pagination a[rel=next]')) {

      casper.echo('Next button present', 'GREEN_BAR');
      casper.thenClick('#results-pagination a[rel=next]');
      casper.wait(2000);
      return nextPage(empl, (n+1));
    }
    else {
      casper.echo('END', 'GREEN_BAR');
      return empl;
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

  this.echo('Attempting start recursion');
  // Stores information as JSON whith name: and image: keys
  var employees = [];
  employees = nextPage(employees, 1);
  this.echo('hello', 'GREEN_BAR');
  
});

casper.run();
