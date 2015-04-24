// Creating Casper instance
var casper = require('casper').create({
  // Prints debug information to console
  verbose: true,
  // Only debug level messages are printed
  logLevel: "info",
  pageSettings: {
    loadImages: true,
    loadPlugins: false,
  }
});

var viewport = [1920, 1080];
var screenshotsDir = "./screenshots/";
var profilePictureDir = "./profile-pictures/";

var email = '';
var password = '';

// Evaluating if command line arguments exists then setting to login variables
if(casper.cli.has(0) && casper.cli.has(1)) {
  var email = casper.cli.get(0);
  var password = casper.cli.get(1);
  casper.echo('Login Email = ' + email,'GREEN_BAR');
  casper.echo('Login password = exists', 'GREEN_BAR');
}


// TDOD: Rework and user jQuery and underscope to get the image srcs
casper.getImages = function() {
    var scripts = document.querySelectorAll('img[src]');
    return Array.prototype.map.call(scripts, function (e) {
        return e.getAttribute('src');
    });
};

// Logining in to linkedin.com/usa/login-submit
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

  // Looing for identity id which relates to small profile preview on main page
  this.waitForSelector('#identity', function() {
    if(this.getTitle() == 'Welcome! | LinkedIn'){
      this.echo('Successfully logged in to LinkedIn', 'GREEN_BAR');
    }
    else {
      this.echo('Login unsuccessful', 'ERROR');
    }
  });
}

casper.start('http://linkedin.com/');

// login using loginLinkedIn function - Takes user name as password from command line arguments
casper.then(function() {
  this.loginLinkedIn(email, password);
});

casper.then(function () {
  this.click('a#advanced-search', function () {
    
  })
})

/* casper.waitForSelector('a#advanced-search', function() {

}) */

casper.run();
