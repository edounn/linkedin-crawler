// Creating Casper instance
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

// Defining fuction to log in to linkedin.com/usa/login-submit
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

// ------

casper.start('http://linkedin.com/');

// Call Log In Function
casper.then(function() {
  this.loginLinkedIn(email, password);
});

casper.then(function() {
  this.click('a#advanced-search');
})

// Submit Search for Company Employes
casper.waitForSelector('#advs', function () {

  this.fillSelectors('form#peopleSearchForm', {
    'input[name=f_CC]': 'Crunchyroll, Inc.'
  }, false);

  this.click('form#peopleSearchForm input.submit-advs');
});

// Get displayed employee links on each page
// Then navigate to next page
casper.then(function() {
  // While there is another page
  while(this.exists('li.next a')) {
    this.echo('Entered while loop', 'GREEN_BAR');
    this.getEmployeeProfileLinks();
    //TODO: Click the next button
  }
}); 

casper.run();
