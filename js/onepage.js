/**
 * Created by tannerjcox on 10/6/16.
 */

$(function () {
  $('.nav-link').click(function () {
    $('title').html($(this).text());
    $('.main-content').load('includes/' + $(this).data('link') + '.html');
    $('.nav-item .nav-link').removeClass('active');
    $(this).addClass('active');
  });
  var currentPage = getCurrentAnchor();
  if (!currentPage) {
    currentPage = 'home';
  }
  $('.main-content').load('includes/' + currentPage + '.html');
  $('.nav-item').removeClass('active');
  $('.' + currentPage + '').addClass('active');
  if (currentPage == 'code-samples') {
    displaySampleLinks();
  }
  $('.sample').click(function () {
    displaySampleLinks();
  });
});

function displaySampleLinks() {
  links = '';
  $.getJSON('/code-samples/samples.json', function (data) {
    $.each(data, function (key, val) {
      $.each(val, function (type, files) {
        links += '<h5>' + type + '</h5>';
        $.each(files, function (title, file) {
          links += '<a href="#code-samples" data-url="code-samples/' + type + '/' + file + '" class="code-sample">' + title + '</a><br>';
        });
      });
    });
    $('#codeSampleLinks').html(links);
  }).done(function () {
    $('.code-sample').click(function () {
      $('.sample-title').html('<h2 class="text-center">' + $(this).text() + '</h2>');
      $('.sample-content').load($(this).data('url'), function() {
        $('pre code').each(function(i, block) {
          hljs.highlightBlock(block);
        });
      });
    });
  });
}
function getCurrentAnchor() {
  url = window.location.href;
  return url.substring(url.indexOf("#") + 1)
}