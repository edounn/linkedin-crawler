// Creating Casper instance
var casper = require('casper').create({
  // Prints debug information to console
  verbose: true,
  // Only debug level messages are printed
  logLevel: "info",
  // Don't load any images or javascript plugins to the site
  pageSettings: {
    loadImages: true,
    loadPlugins: false,
  }
});

// Test profiles
var fixedProfiles = [
'https://linkedin.com/in/jacobryoung',
'https://linkedin.com/in/michaelbyoung',
'https://linkedin.com/pub/alan-guan/40/a47/56b'
];

var saveDir = './screenshots/';
var viewport = [1920, 1080];

var imagesArray = [];

function getImages() {
    var scripts = document.querySelectorAll('img[src]');
    return Array.prototype.map.call(scripts, function (e) {
        return e.getAttribute('src');
    });
};

casper.start();

// Navigate to each profile, take a picture of their profile, then get their profile picture.
casper.eachThen(fixedProfiles, function(link) {

  // Opening the pages
  this.thenOpen(link.data, function(link) {
    // Viewport to desired width and height
    this.viewport(viewport[0], viewport[1]);

    // File name is the directory + the url without https://
    var fileName = saveDir + link.url.replace(/[^a-zA-Z0-9]/gi, '').replace(/^https?-+/, '') + '.png';

    this.evaluate(getImages);






    // Take screenshot of page with viewport dimensions
    this.capture(fileName, {
      top: 0,
      left: 0,
      width: viewport[0],
      height: viewport[1]
    });

  });
});


casper.run();
