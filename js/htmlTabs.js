$(document).ready(function(){
  $('nav.tabs li').click(function(){
    var clicked = $(this);
    $('nav.tabs li.active').removeClass('active');
    clicked.addClass('active');
    change(clicked.attr('class').split(' ')[0]);
  });
  function change(name){
    $('ul.content > li').hide()
    $('ul.content > li.'+name).fadeIn();
  }
  if(window.location.hash !=''){
    var klass = window.location.hash.replace('#','');
    change(klass);
    $('nav.tabs li.'+klass).addClass('active');
  }
});