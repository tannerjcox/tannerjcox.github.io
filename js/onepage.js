/**
 * Created by tannerjcox on 10/6/16.
 */

$(function () {
  $('.main-content').load('includes/home.html');
  $('.home').click(function () {
    $('title').html('Home');
    $('.main-content').load('includes/home.html');
    $('.nav-item').removeClass('active');
    $(this).parent().addClass('active');
  });
  $('.about').click(function () {
    $('title').html('About Me');
    $('.main-content').load('includes/about.html');
    $('.nav-item').removeClass('active');
    $(this).parent().addClass('active');
  });
  $('.sample').click(function () {
    $('title').html('Code Samples');
    $('.main-content').load('includes/code-samples.html');
    $('.nav-item').removeClass('active');
    $(this).parent().addClass('active');
  });

});
