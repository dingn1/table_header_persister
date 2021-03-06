"use strict";

var $ = require("jquery");

function PersistTableHeaders() {
  $(".persist-area").each(function() {

    var el = $(this),
      offset = el.offset(),
      scrollTop = $(window).scrollTop(),
      floatingHeader = $(".floatingHeader", this);
    if ((scrollTop > offset.top) && (scrollTop < offset.top + el.height())) {
        floatingHeader.css({ "visibility": "visible" });
    } else {
      floatingHeader.css({ "visibility": "hidden" });
    };
  });
}

// DOM Ready
$(function() {
  var clonedHeader;

  $(".persist-area").each(function() {
    clonedHeader = $(".persist-header", this);
    clonedHeader.before(clonedHeader.clone()).css("width", clonedHeader.width()).addClass("floatingHeader");
  });

  $(".scroll-top").click(function() {
    $(window).scrollTop(0);
  });

  $(window).scroll(PersistTableHeaders).trigger("scroll");

});

module.exports = "formHeaderPersister";
