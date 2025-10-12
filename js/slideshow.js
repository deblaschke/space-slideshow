// Indicates manual (true) or automatic (false) slideshow
var MANUAL_SLIDESHOW = false;
// Automatic slideshow interval in milliseconds
var SLIDESHOW_INTERVAL = 3000;
// Automatic slideshow block interval in milliseconds
var SLIDESHOW_BLOCK_INTERVAL = 333;
// Indicates audio (true) or no audio (false) during slideshow
var SLIDESHOW_AUDIO = false;

// Current slide index
var slideIndex;
// Timeout object (Number representing timer ID)
var slideshowTimeout = null;
// Sound object (HTMLAudioElement object)
var slideshowSound = null;
// Array of slides with class "spacePix"
var slideshowElems = document.getElementsByClassName("spacePix");
// Indicates if mobile device (if not detected, default behavior occurs which is acceptable)
var isMobileDevice = false;

// Speed up slideshow within blocks (begin -> end)
var slideBlockBegin = ["G1090153", "I1040101", "I1060491", "I1110444", "I1150398", "N1080559", "N1140585", "N1340497", "N1400247", "N1410151"];
var slideBlockEnd   = ["G1090195", "I1040294", "I1060566", "I1110495", "I1150466", "N1080657", "N1140624", "N1340588", "N1400393", "N1410262"];

// Allow for override of default behavior in URL via query parameters
if ("URLSearchParams" in window) {
  var urlParams = new URLSearchParams(window.location.search);
  var urlParam = urlParams.get('mode');
  if (urlParam === 'manual') {
    MANUAL_SLIDESHOW = true;
  }
  urlParam = urlParams.get('interval');
  if (/^\d+$/.test(urlParam)) {
    SLIDESHOW_INTERVAL = parseInt(urlParam, 10);
  }
  urlParam = urlParams.get('audio');
  if (urlParam === 'off') {
    SLIDESHOW_AUDIO = false;
  }
}

// getDescription returns description for regular slide
function getDescription(path) {
  var result = "";

  // path is of format "*/file.jpg"
  // file is of format "yyyymmdd_picture-description" where yyyy is always four-digit year

  // Process valid paths (must have directory separator and .jpg/.gif extension)
  path = decodeURI(path);
  var index = path.lastIndexOf('/');
  if (index >= 0 && path.lastIndexOf('.jpg') > index) {
    var file = path.substring(index + 1, path.lastIndexOf('.'));

    // File begins with "yyyymmdd_" or "yyyymmddT" for slides
    if (/^[0-9md]{8}[_T]{1}/.test(file)) {
      var date = file.substring(0, 8);

      if (/^[0-9md]{8}_[C-Z]{1}[0-9]{7}/.test(file)) {
        // Found digital camera picture name ("yyyymmdd_Annnnnnn")
        result = file.substring(9, 17);
        index = 17;
      } else if (/^[0-9md]{8}_[A-B]{1}[0-9]{3}-[0-9]{2}/.test(file)) {
        // Found film camera picture name ("yyyymmdd_Annn-nn")
        result = file.substring(9, 16);
        index = 16;
      } else if (/^[0-9md]{8}T[0-9]{6}/.test(file)) {
        // Found cell phone camera picture name ("yyyymmddTnnnnnn") NOT YET USED!
        result = file.substring(0, 8) + file.substring(9, 15);
        index = 15;
      }

      // Continue processing if recognized picture name
      if (result.length > 0) {
        // Handle description if present
        index = file.indexOf('-', index);
        if (index >= 0) {
          // Picture description is everything after "-"
          var desc = file.substring(index + 1);

          // Replace underscores with spaces
          result = result + " - " + desc.replace(/_/g, ' ');

          // Replace special characters ("[*]") with HTML entity names ("&*;")
          index = file.indexOf('[');
          if (index >= 0 && index < file.indexOf(']')) {
            result = result.replace(/\[/g, '&');
            result = result.replace(/\]/g, ';');
          }
        }

        // Get English date from yyyymmdd accounting for unknown month and/or day
        var dateStr = "";
        if (date.substring(4, 6) != "mm") {
          var month = [ "January", "February", "March", "April",
                        "May", "June", "July", "August", "September",
                        "October", "November", "December" ][+date.substring(4, 6) - 1];
          if (date.substring(6, 8) != "dd") {
            var day = date.substring(6, 8);
            if (day.charAt(0) == '0') {
              day = day.charAt(1);
            }
            dateStr = month + " " + day + ", " + date.substring(0, 4);
          } else {
            dateStr = month + " " + date.substring(0, 4);
          }
        } else {
          dateStr = date.substring(0, 4);
        }

        if (dateStr.length > 0) {
          result = result + "<BR>(" + dateStr + ")";
        }
      }
    }
  }

  // Display space to occupy slideName span if description empty
  if (result.length == 0) {
    result = "&nbsp;<BR>&nbsp;";
  }

  return result;
}

// hidePlayButton hides play/pause button for manual slideshows
function hidePlayButton() {
  document.getElementById("buttonPlayPause").style.display = "none";
}

// toggleFlow plays/pauses slideshow as result of user action (mouseclick or keystroke)
// where elem is play/pause button
function toggleFlow(elem) {
  if (slideshowTimeout != null) {
    // Pause slideshow
    clearInterval(slideshowTimeout);
    slideshowTimeout = null;

    // Set button text to ">" (play)
    elem.innerHTML = "&#9658;";
    elem.title = "Play";

    // Pause audio if it exists
    if (slideshowSound != null) {
      slideshowSound.pause();
    }
  } else {
    // Play slideshow
    slideshow();

    // Set button text to "||" (pause)
    elem.innerHTML = "&#10074;&#10074;";
    elem.title = "Pause";

    // Play audio if it exists
    if (slideshowSound != null) {
      slideshowSound.play();
    }
  }
}

// changePic changes slide as result of user action (mouseclick or keystroke)
// where n is delta (+1 or -1)
function changePic(n) {
  showPic(n);

  if (!MANUAL_SLIDESHOW) {
    // Automatic slideshow

    if (slideshowTimeout != null) {
      // Set new timeout for new slide
      clearInterval(slideshowTimeout);
      slideshowTimeout = setInterval(slideshow, SLIDESHOW_INTERVAL);

      // Play audio if it exists
      if (slideshowSound != null) {
        slideshowSound.play();
      }
    }
  } else {
    // Manual slideshow

    // Play audio if it exists
    if (slideshowSound != null) {
      slideshowSound.play();
    }
  }
}

// showPic displays slide where n is change to slideIndex
function showPic(n) {
  slideIndex += n;

  // Handle wrapping past end of slideshow
  if (slideIndex > slideshowElems.length) {slideIndex = 1}

  // Handle wrapping before beginning of slideshow
  if (slideIndex < 1) {slideIndex = slideshowElems.length}

  // Set all slides to hidden
  for (var i = 0; i < slideshowElems.length; i++) {
    slideshowElems[i].style.display = "none";
  }

  // Set current slide to visible
  slideshowElems[slideIndex-1].style.display = "block";

  // Set slide description
  document.getElementById("slideName").innerHTML = getDescription(slideshowElems[slideIndex-1].src);
}

// slideshow runs automatic slideshow
function slideshow() {
  showPic(1);

  // Set slide description
  var slideName = getDescription(slideshowElems[slideIndex-1].src);

  // Speed up or slow down slideshow if slide is beginning/end of block
  var index = slideName.trim().indexOf(' ');
  if (index != -1) {
    slideName = slideName.substring(0, index);
  }
  var slideInterval = SLIDESHOW_INTERVAL;
  if (slideBlockBegin.includes(slideName) && SLIDESHOW_INTERVAL > SLIDESHOW_BLOCK_INTERVAL) {
    // Speed up slideshow at beginning of slide block
    slideInterval = SLIDESHOW_BLOCK_INTERVAL;
    clearInterval(slideshowTimeout);
    slideshowTimeout = null;
  } else if (slideBlockEnd.includes(slideName)) {
    // Slow down slideshow at end of slide block
    slideInterval = SLIDESHOW_INTERVAL;
    clearInterval(slideshowTimeout);
    slideshowTimeout = null;
  }

  // Play slideshow if paused, speeding up, or slowing down
  if (slideshowTimeout == null) {
    slideshowTimeout = setInterval(slideshow, slideInterval);
  }
}

// Handle left arrow, right arrow and pause keys
document.onkeydown = function(event) {
  switch (event.key) {
    case 'ArrowLeft':
      changePic(-1);
      break;
    case 'ArrowRight':
      changePic(1);
      break;
    case 'Escape':
      if (!MANUAL_SLIDESHOW) {
        toggleFlow(document.getElementById("buttonPlayPause"));
      }
      break;
  }
}

// Load and play audio if configured
if (SLIDESHOW_AUDIO) {
  // Create audio object
  slideshowSound = new Audio("media/audio.mp3");

  // Set audio object to loop
  if (typeof slideshowSound.loop == 'boolean') {
    slideshowSound.loop = true;
  } else {
    slideshowSound.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    }, false);
  }

  // Play audio object, catching/ignoring any errors
  promise = slideshowSound.play();
  if (promise != null) {
    promise.catch(function(error) { });
  }
}

// setPicDimensions sets dimensions of #innerTable based on window dimensions and device type
function setPicDimensions() {
  // Find smallest window dimension
  var minDim = Math.min(window.innerHeight, window.innerWidth);

  // Calculate smallest dimension based on smallest window dimension and device type
  if (minDim > 842 && isMobileDevice) {
    minDim = 842; /* 95% of 842 is 800 (bump up mimimum on mobile because width is large but screen is small) */
  } else if (minDim > 674) {
    minDim = 674; /* 95% of 674 is 640, which is actual slide resolution */
  } else if (minDim < 269) {
    minDim = 269; /* 95% of 269 is 256, which is as small as we want to go */
  }

  // Set innerTable dimensions (a square) to smallest dimension
  document.getElementById("innerTable").style.width = minDim + 'px';
  document.getElementById("innerTable").style.height = minDim + 'px';

  // Set slideName width to smaller than innerTable width
  document.getElementById("slideName").style.width = (minDim-2) + 'px';
}

// Handle window load
window.onload = function() {
  if (!SLIDESHOW_AUDIO) {
    // Remove music credit (last slide) if it exists
    var audioCredit = slideshowElems[slideshowElems.length-1].src;
    if (audioCredit.indexOf("theend3") != -1) {
      slideshowElems[slideshowElems.length-1].remove();
    }
  }
}

// Handle window resize
window.onresize = function() {
  setPicDimensions();
}

// Handle DOM loaded event
document.addEventListener("DOMContentLoaded", (event) => {
  isMobileDevice = /iPhone|Android|BlackBerry/i.test(navigator.userAgent);
  setPicDimensions();
  slideIndex = 0;

  // Initiate slideshow
  if (MANUAL_SLIDESHOW) {
    hidePlayButton();
    showPic(1);
  } else {
    slideshow();
  }
});
