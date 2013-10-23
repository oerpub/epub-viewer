
// get relative path from a filename url
// e.g. http://whatever.com/here/togo/file.htm
// returns /here/togo/
function getDirectory(url)
{
  var tempurl = document.createElement('a');
  tempurl.href = url;
  var pathArray = tempurl.pathname.split('/');
  var newPathname = "";
  for ( i = 0; i < pathArray.length-1; i++ ) {
    newPathname += pathArray[i];
    newPathname += "/";
  }
  return newPathname;
}

// Load script with Callback
function loadScript(url, callback) {
    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState) { //IE
        script.onreadystatechange = function () {
            if (script.readyState == "loaded" || script.readyState == "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else { //Others
        script.onload = function () {
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function startEpubViewer(){
  // load jquery references manually (better host them our self!)
  loadScript("http://code.jquery.com/jquery-1.10.2.min.js", function() {

  $(document).ready(function(){
    loadScript("http://code.jquery.com/jquery-migrate-1.2.1.min.js", function() {
    loadScript("http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-MML-AM_HTMLorMML-full", function() {

      // clear complete webpage. Build webpage with jQuery
      if ($('title').length) {
        $('title').empty();
      }
      else {
        $('head').prepend('<title></title>');
      }
      $('title').text('Contents of EPUB');
      $('body').empty();
      $('body').append('<h1>Contents of EPUB</h1>');
      $('body').append('<div id="books"></div>');
      $('body').append('<div id="content"></div>');

      // load CSS dynamically. WARNING: Using fixed link!
      if (document.createStyleSheet){ // IE
          document.createStyleSheet('http://oerpub.github.io/epub-viewer/epubviewer.css');
      }
      else {
          $("head").append($("<link rel='stylesheet' href='http://oerpub.github.io/epub-viewer/epubviewer.css' type='text/css' media='screen' />"));
      }

      // Parse EPUB:
      // Parse container.xml
      $.ajax({
          type: "GET",
          url: "META-INF/container.xml",
          dataType: "xml",
          success: function(xml) {
              $(xml).find('rootfile').each(function(){
                  var opf = $(this).attr('full-path');

                  // Parse OPFs
                  $.ajax({
                      type: "GET",
                      url: opf,
                      dataType: "xml",
                      success: function(xml) {
                          var booktitle = $(xml).find('dc\\:title, title').text();
                          $(xml).find('item[properties="nav"]').each(function(){
                              var nav = $(this).attr('href');
                              nav = getDirectory(opf) + nav;
                                      $('<div class="book"></div>')
                                        .load(nav, function() {
                                            // set booktitle
                                            if (! $(this).children('h1').length) {
                                              $(this).prepend('<h1></h1>');
                                            }
                                              $(this).children('h1').eq(0).text(booktitle);
                                            // filter not enclosed text out before we reach the first tag
                                            $(this).contents()
                                            .filter(function () {
                                                return this.nodeType === 3;
                                            }).first().remove();
                                            // replace every relative link in navigation
                                            $(this).find('a').not('[href^="http"],[src^="https"],[src^="/"],[src^="mailto"],[src^="#"]').each(function(){
                                              var newLink = getDirectory(nav) + $(this).attr('href');
                                              $(this).attr('href', newLink);
                                            });
                                        })
                                        .appendTo('#books');
                          });
                      }
                  });
              });
          }
      });

      // Prevent opening links 
      $('#books').on('click', 'a', function(e) {
         e.preventDefault();
         var contentUrl = $(this).attr('href');
         var relativeDirectory = getDirectory(contentUrl);
         $.get(contentUrl)
           .success(function(data) {
              var $data = $(data);
              $data.find('img').not('[src^="http"],[src^="https"],[src^="/"]').each(function(){
                var newImageSrc = relativeDirectory + $(this).attr('src');
                $(this).attr('src', newImageSrc);
              });
              $("#content").html($data).show();
              MathJax.Hub.Queue(["Typeset",MathJax.Hub,'content']);
         })
      });
    });
    });
  });
});
}

// start EPUB viewer
startEpubViewer();
