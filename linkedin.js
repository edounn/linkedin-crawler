// Creating Casper instance
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
var profilePictureDir = "./profile-pictures/";

// Login credentials
var email = '';
var password = '';

// Employee links and profile pictures
var linkHrefs = [];

// Evaluating if command line arguments exists then setting to login variables
if(casper.cli.has(0) && casper.cli.has(1)) {
  var email = casper.cli.get(0);
  var password = casper.cli.get(1);
  casper.echo('Login Email = ' + email,'GREEN_BAR');
  casper.echo('Login password = protected', 'GREEN_BAR');
}

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
casper.on("resource.error", function(resourceError) {
  this.echo("ResourceError: " + JSON.stringify(resourceError, undefined, 4));
});

// http://docs.casperjs.org/en/latest/events-filters.html#page-initialized
casper.on("page.initialized", function(page) {
    // CasperJS doesn't provide `onResourceTimeout`, so it must be set through 
    // the PhantomJS means. This is only possible when the page is initialized
    page.onResourceTimeout = function(request) {
      console.log('Response Timeout (#' + request.id + '): ' + JSON.stringify(request));
    };
  });

// ----------------------------

// TDOD: Rework and user jQuery and underscore to get the image srcs
casper.getProfilePicture = function() {
  var scripts = document.querySelectorAll('img[src]');
  return Array.prototype.map.call(scripts, function (e) {
    return e.getAttribute('src');
  });
};

// Given an array of link tags, return an array of hrefs
casper.getEmployeeProfileLinks = function() {
  var tempArray = this.evaluate(function() {
    return document.querySelectorAll('#results li a');
  });

  for(var i = 0; i < tempArray.length; i++){
    this.echo(tempArray[i]);
  }
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


// ----------------------------

casper.start('http://linkedin.com/');

// Login
casper.then(function() {
  this.loginLinkedIn(email, password);
});

// Wait for the advacned seatch link to be 
casper.waitForSelector('#advanced-search', function() {
  this.click('#advanced-search');
});

// Waiting for the advanced search div to be visible to the remote DOM
casper.waitForSelector('#srp_main_', function() {

  // Click on 'Current Company'
  this.click('li#adv-facet-CC legend.facet-toggle');

  // Click on 'Add' button
  this.click('#adv-facet-CC button.add-facet-button');

  // Sending keystrokes using Casper is requried because the HTML form on the advanced search form does not repond to Casper's form submission boolean in 
  // casper.fill('selector', {'key': 'value'}, submitBoolean)
  this.then(function() {

    // Even though keepFocus is true, the autocomplete widgets do not show up
    this.sendKeys('form#peopleSearchForm input[name=f_CC][type=text]', 'Facebook', {keepFocus: true});
    this.capture('screenshots/expected-search-parameters.png');
       
  });

  this.then(function() {
    this.click('input[type=submit][name=submit]');
  });

});

casper.waitWhileVisible('.loading');

casper.then(function() {
  this.capture('screenshots/results.png');
});

casper.run();
