
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

$(document).ready(function(){
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
