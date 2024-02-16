$(function(){  // link menu
    $("#nav-placeholder").load("nav.html");
    });

function myFunction() {   //menu responsive
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }
