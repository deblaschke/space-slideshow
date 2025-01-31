// getDescription returns description for regular slide
function getDescription(path) {
  var result = "";

  // path is of format "*/file.[jpg|gif]"
  // file is of format "yyyymmdd_picture-description"

  // Process valid paths (must have directory separator and .jpg/.gif extension)
  path = decodeURI(path);
  var index = path.lastIndexOf('/');
  if (index >= 0 && ((path.lastIndexOf('.jpg') > index) || (path.lastIndexOf('.gif') > index))) {
    var file = path.substring(index + 1, path.lastIndexOf('.'));

    // File begins with "yyyymmdd_" for slides
    if (file.match(/^[0-9ymd]{8}[_T]{1}/)) {
      var date = file.substring(0, 8);

      if (file.match(/^[0-9ymd]{8}_[C-Z]{1}[0-9]{7}/)) {
        // Found digital camera picture name ("yyyymmdd_Annnnnnn")
        result = file.substring(9, 17);
        index = 17;
      } else if (file.match(/^[0-9ymd]{8}_[A-B]{1}[0-9]{3}-[0-9]{2}/)) {
        // Found film camera picture name ("yyyymmdd_Annn-nn")
        result = file.substring(9, 16);
        index = 16;
      } else if (file.match(/^[0-9ymd]{8}T[0-9]{6}/)) {
        // Found cell phone camera picture name ("yyyymmddTnnnnnn")
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

          // Replace at sign with English
          result = result.replace(/@/g, " viewed from ");

          // Replace special characters ("[*]") with HTML entity names ("&*;")
          index = file.indexOf('[');
          if (index >= 0 && index < file.indexOf(']')) {
            result = result.replace(/\[/g, '&');
            result = result.replace(/\]/g, ';');
          }
        }

        date = convertDate(date);
        if (date.length > 0) {
          result = result + "<BR>(" + date + ")";
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

var months = {
    '01' : 'January',
    '02' : 'February',
    '03' : 'March',
    '04' : 'April',
    '05' : 'May',
    '06' : 'June',
    '07' : 'July',
    '08' : 'August',
    '09' : 'September',
    '10' : 'October',
    '11' : 'November',
    '12' : 'December'
};

// convertDate returns English version of yyyymmdd accounting for unknown year, month, and day
function convertDate(date) {
  if (date.length >= 4 && date.substring(0,4) != 'yyyy') {
    var day = "";
    var month = "";
    var year = date.substring(0, 4);
    if (date.length >= 6 && date.substring(4, 6) != 'mm') {
      month = months[date.substring(4, 6)];
      if (date.length >= 8 && date.substring(6, 8) != 'dd') {
        day = date.substring(6, 8);
        if (day.charAt(0) == '0') {
          day = day.charAt(1);
        }
        return month + " " + day + ", " + year;
      } else {
        return month + " " + year;
      }
    } else {
      return year;
    }
  }

  return "";
}
