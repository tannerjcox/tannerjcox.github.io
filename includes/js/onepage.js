/**
 * Created by tannerjcox on 10/6/16.
 */

$(function () {
  $('.nav-link').click(function () {
    $('title').html($(this).text());
    $('.nav-item .nav-link').removeClass('active');
    $(this).addClass('active');
    showHideHomeImage($(this).data('link') === 'home');
    handleHeaderLinks($(this).data('link'));
  });

  var currentPage = getCurrentAnchor();
  showHideHomeImage(currentPage === 'home');
  handleHeaderLinks(currentPage);
  displaySampleLinks();
});

function showHideHomeImage(isHomePage) {
  if (isHomePage) {
    $('.header-image-container').slideDown();
  } else {
    $('.header-image-container').slideUp();
  }
}

function handleHeaderLinks(currentPage) {
  $('.page-container').addClass('hidden-xs-up');
  $('.' + currentPage + '-container').removeClass('hidden-xs-up');
  $('.nav-item').removeClass('active');
  $('.' + currentPage + '').addClass('active');
}

function displaySampleLinks() {
  var links = '';
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
      renderSamples($(this).data('url'));
    });
  });
}

function renderSamples(url) {
  $('.sample-title').html('<h2>' + $(this).text() + '</h2>');
  $('.sample-content').load(url, function () {
    $('pre code').each(function (i, block) {
      hljs.highlightBlock(block);
    });
  });
}

function getCurrentAnchor() {
  var url = window.location.href;
  if (url.indexOf("#") > -1) {
    page = url.substring(url.indexOf("#") + 1);
    if (page == '') {
      page = 'home';
    }
  } else {
    page = 'home';
  }
  return page
}
