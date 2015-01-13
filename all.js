$(document).ready(function(){ 
        $("#radio").buttonsetv();
        $("#CEradio").buttonsetv();
        $("#checkbox").buttonsetv();
});

/*$(window).load(function(){
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	var tables[vars.length][vars.length];
	for(var i = 0; i < vars.length; i++){

	}
	console.log(vars);
});*/

<!-- grab the table parameter that was set in the URL and send it to the application start function -->
$(window).load(function(){
	start(decodeURI(location.search.slice(location.search.indexOf('=')+1, location.search.length)));
});

//set the piont size slider default values and update function
$(function() {
    $("#pointSizeSlider").slider({min: 1, 
                                  max: 10, 
                                  range: "min", 
                                  value: 1, 
                                  slide: function(event, ui) {
                                                $("#pSize").val(ui.value);
                                                changePointSize(ui.value);
                                         }
                                 });
	$("#pSize").val($("#pointSizeSlider").slider("value"));
});

//set the grid size slider default values and update function
$(function() {
    $("#gridSizeSlider").slider({min: 0, 
                                 max: 10, 
                                 range: "min", 
                                 value: 0, 
                                 slide: function(event, ui) {
                                    $("#gSize").val(Math.pow(10.0, ui.value) + " meter(s)");
                                    changeGridSize($("#gridSizeSlider").slider("option", "max") - ui.value);
                                 }
    });
});

//set the grid position slider default values and update function
$(function() {
    $("#gridPositionSlider").slider({min: -50, 
                                     max: 50, 
                                     range: "min", 
                                     value: 0,
                                     orientation: "vertical",
                                     slide: function(event, ui) {
                                        $("#gPos").val(changeGridPos(ui.value).toFixed(3));
                                    }
   });
});

//login dialog box
$(function() {
    var username = $("#username"), password = $("#password");
    $("#login-form").dialog({
        autoOpen: false,
        height: 230,
        width: 300,
        modal: true,
        buttons: {
            OK: function() {             
                loginUser(username.val(), password.val());
                $(this).dialog("close");
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function() {flipControl(); username.val(""); password.val("");}
    });
    $("#login").button().click(function() {flipControl(); $("#login-form").dialog("open");});
});

//dialog box to display marker controls
//only shows when a user is logged in
$(function() {
    $("#dialog-help").dialog({autoOpen: false, modal: true, close: function() {flipControl();}});
    $("#controls-help").dialog({autoOpen: false, modal: true, close: function() {flipControl();}});
    $("#markerhelp").click(function() {flipControl(); $("#dialog-help").dialog("open");});
    $("#controls-btn").click(function() {
      flipControl(); $("#controls-help")
        .dialog("open")
        .dialog("option", "width", 800)
        .dialog("option", "height", 400);
    });
});

//progress bar is displayed when a user submits a marker and the server is calculating the 95th height percentile
$(function() {
    $("#working").progressbar({value: false});
});
