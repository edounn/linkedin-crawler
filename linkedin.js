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

// http://docs.casperjs.org/en/latest/events-filters.html#page-error
casper.on("page.error", function(msg, trace) {
  this.echo("Error: " + msg);
    // maybe make it a little fancier with the code from the PhantomJS equivalent
  });

// http://docs.casperjs.org/en/latest/events-filters.html#page-initialized
casper.on("page.initialized", function(page) {
    // CasperJS doesn't provide `onResourceTimeout`, so it must be set through 
    // the PhantomJS means. This is only possible when the page is initialized
    page.onResourceTimeout = function(request) {
      console.log('Response Timeout (#' + request.id + '): ' + JSON.stringify(request));
    }
  });

// Custom Functions
//-------------------------------------------------------------------------

casper.renderArrayJSON = function(array) {
  var output = '';
  array.map(function(user){
    output += JSON.stringify(user);
  });
  return casper.echo(output);
}

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
}

// Pagination - uses recursion to click 'Next' after completing getUserDataOnPage()

function loopPagination (aEmpl, n) {

  casper.waitForSelector('ol#results', function() {

    casper.echo('Page ' + n, 'GREEN_BAR');

    // Scraping the page's content for names and image URLS
    var resultsFromPage = casper.getUserDataOnPageNonPremium();

    // Getting objects from within resultsFromPage and adding them to aEmpl
    resultsFromPage.map(function(user) {
      aEmpl.push(user);
    })

    if(casper.visible('#results-pagination a[rel=next]')) {

      casper.echo('Next button present', 'GREEN_BAR');
      casper.thenClick('#results-pagination a[rel=next]');
      casper.wait(2000);
      loopPagination(aEmpl, (n+1));
    }
    else {
      casper.echo('END OF RESULTS - DOWNLOADING IMAGES', 'GREEN_BAR');
      casper.renderArrayJSON(aEmpl);
      casper.downloadPageResults(aEmpl);
    }
  }); 
}

// Returns an array of employee objects
casper.getUserDataOnPageNonPremium = function() {

  return this.evaluate(function() {

    // ONLY FINDING EMPLOYEES WHO ARE ARE VISIBLE TO NON-PREMIUM ACCOUNT (I.E. MINE)
    var userNames= [];
    var userImgSrcs = [];
    var pageResults = [];

    $('ol#results li.mod').map(function() {
      var name = $(this).find('a.title').text();
      var imgElement = $(this).find('a>img');


      if(!($(imgElement).hasClass('ghost'))) {
        if(name === 'LinkedIn Member') {
          name = 'Unknown';
        }
        userNames.push(name);
        userImgSrcs.push($(imgElement).attr('src'));
      }
    }).get()

    console.log(userNames.toString());
    console.log(userImgSrcs.toString());

    if(userNames.length === userImgSrcs.length) {
      for(var i = 0; i < userImgSrcs.length; i++){
        pageResults.push({name: userNames[i], img: userImgSrcs[i]}) 
      }
      // Returning an array of employee objects
      return pageResults
    }
    else {
      console.log('Mismatch in user/image count');
      console.log('Names: ' + userNames.length);
      console.log('Srcs: ' + userImgSrcs.length);
    }
  });
}

// Arguments: Array of user objects, page number from loopPagination function counter
casper.downloadPageResults = function(employees) {

  employees.map(function(user, index) {
    
    var filepath = profilePictureDirectory + 'crucnhyroll' + '-';

    if(user.name == 'Unknown' || user.name == ''){
      filepath += 'unkown' + index + '.png';
      casper.echo(filepath);
    }
    else {
      filepath += user.name + '.png';
      casper.echo(filepath);
    }
    casper.download(user.img, filepath);
  });
}

// Starting Casper Actions
//-------------------------------------------------------------------------

casper.start('https://linkedin.com').then(function() {
  this.loginLinkedIn(email, password);

  // Clearing global varibales with login information because safety second
  email = '';
  password = '';
});

// Opening URL to company employee results
casper.then(function() {
  this.open('https://www.linkedin.com/vsearch/p?f_CC=167212&trk=rr_connectedness');
});

casper.then(function() {
  loopPagination([], 1);
});

casper.run();
