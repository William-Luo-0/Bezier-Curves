// Check the availability of WebGL
const canvas = document.getElementById("glCanvas");

const gl = canvas.getContext("webgl2");
if (gl == null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
}


// Make the drawingbuffer match the div size of browser
function resize_canvas(){
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
 
    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {
 
        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
}


// Find out which control point is selected
function if_click_point(click_location, points)
{
    var idx = -1;

    points.forEach(element => {
        var segment = click_location.subtract(element);

        var dis = segment.len();
        if (dis < 0.03) {
            idx = points.indexOf(element);
            return idx;
        }
    });

    return idx;
}


// Draw function
// Draw the control points, control polygon and curve
function draw(curve) {
    curve.drawSetup();
    curve.drawControlPoints();
	
    curve.drawCurve();
}


// Initial event handler for canvas
function initEventHandlers (canvas, curve, gl_operation) {
    var lastX = -1;
    var lastY = -1;
    
    var dragging = false;
    var chosen_point = -1;
 
    canvas.onmousedown = function(ev) {  //Mouse is pressed
        var x = ev.clientX;
        var y = ev.clientY;
 
        var rect = ev.target.getBoundingClientRect();

        if(rect.left <= x && x <= rect.right &&
           rect.top <= y && y <= rect.bottom) {
            
            lastX = x; 
            lastY = y;

            x = ((x - rect.left) - (canvas.width / 2)) / (canvas.width / 2);
            y = ((canvas.height / 2) - (y - rect.top)) / (canvas.height / 2);

            var point = new Vector2D(x, y);
            chosen_point = if_click_point(point, curve.getControlPoints());

            if (chosen_point == -1) {
                curve.addControlPoint(point);
            }
            else {

                dragging = true;
            }

            draw(curve);
        }
    };
 
    canvas.onmouseup = function(ev){ //Mouse is released
        dragging = false;
        chosen_point = -1;
    };
 
    canvas.onmousemove = function(ev) { //Mouse is moved
        if (dragging) {
            var x = ev.clientX;
            var y = ev.clientY;

            var rect = ev.target.getBoundingClientRect();

            x = ((x - rect.left) - (canvas.width / 2)) / (canvas.width / 2);
            y = ((canvas.height / 2) - (y - rect.top)) / (canvas.height / 2);

            var point = curve.getControlPoint(chosen_point);
            point.set(x, y);
            
            draw(curve);
        }
    };
}


// Map the drawing buffer to the size of div on browser
resize_canvas();
// Add resize window event listener
window.addEventListener("resize", resize_canvas);


// Set up the WebGL operation interface
var gl_operation = new WebGL(canvas, gl);
gl_operation.setup();

// Initial curve
var curve = new Bezier();
// Link the curve to Webgl interface
curve.setGL(gl_operation);

draw(curve);


// Initial canvas event handlers
initEventHandlers(canvas, curve, gl_operation);

var clear_all_button = document.getElementById("clearAllPoints");
clear_all_button.addEventListener("click", function(){
    curve.clearControlPoints();
    draw(curve);
});


$(".dropdown-menu").on("click", function(event){
    var text = $(event.target).text();
    var target = event.currentTarget.id;
    if (target == "modeDropdownMenu") {
      var btn = document.getElementById("ModeDropdownMenuButton");
      btn.innerHTML = text;
      curve.setCurveMode(text);
      if (text != "De Casteljau") {
        draw(curve);
      }
    }
    else if (target == "continuityDropdownMenu") {
      var btn = document.getElementById("ContiDropdownMenuButton");
      btn.innerHTML = text;
      curve.setContinuityMode(text);
      draw(curve);
    }
});


var subdivisionInput = document.getElementById("subdivisionInput");
subdivisionInput.addEventListener("focusout", function(){
    var input_value = subdivisionInput.value;
    curve.setSubdivisionLevel(input_value);
    draw(curve); 
});

var subInc = document.getElementById("subIncrease");
subInc.addEventListener("click", function(){
    var input_value = parseInt(subdivisionInput.value);
    input_value += 1;
    subdivisionInput.value = input_value;
    curve.setSubdivisionLevel(input_value);
    draw(curve);
});


var subDec = document.getElementById("subDecrease");
subDec.addEventListener("click", function(){
    var input_value = parseInt(subdivisionInput.value);
    if (input_value > 0) {
        input_value -= 1;
        subdivisionInput.value = input_value;
        curve.setSubdivisionLevel(input_value);
        draw(curve);
    }
});


var piecewiseInput = document.getElementById("piecewiseInput");
piecewiseInput.addEventListener("focusout", function(){
    var input_value = piecewiseInput.value;
    curve.setPiecewiseDegree(input_value);
    draw(curve);
});

var degInc = document.getElementById("degIncrease");
degInc.addEventListener("click", function(){
    var input_value = parseInt(piecewiseInput.value);
    input_value += 1;
    piecewiseInput.value = input_value;
    curve.setPiecewiseDegree(input_value);
    draw(curve);
});


var degDec = document.getElementById("degDecrease");
degDec.addEventListener("click", function(){
    var input_value = parseInt(piecewiseInput.value);
    if (input_value > 1) {
        input_value -= 1;
        piecewiseInput.value = input_value;
        curve.setPiecewiseDegree(input_value);
        draw(curve);
    }
});

var deCasteljauInput = document.getElementById("deCasteljauInput");
deCasteljauInput.addEventListener("focusout", function(){
    var input_value = deCasteljauInput.value;
    curve.setDeCasteljauT(input_value/100);
});

var tInc = document.getElementById("tIncrease");
tInc.addEventListener("click", function(){
    var input_value = parseInt(deCasteljauInput.value);
    if (input_value + 5 < 100) {
        input_value += 5;
        deCasteljauInput.value = input_value
        curve.setDeCasteljauT(input_value/100);
    }
    else {
        deCasteljauInput.value = 100;
        curve.setDeCasteljauT(1);
    }
});


var tDec = document.getElementById("tDecrease");
tDec.addEventListener("click", function(){
    var input_value = parseInt(deCasteljauInput.value);
    if (input_value - 5 > 0) {
        input_value -= 5;
        deCasteljauInput.value = input_value;
        curve.setDeCasteljauT(input_value/100);
    }
    else {
        deCasteljauInput.value = 0;
        curve.setDeCasteljauT(0);
    }
});

var isAnimating = false;
var deCasteljauAnimate = document.getElementById("deCasteljauAnimate");
deCasteljauAnimate.addEventListener("click", function(){
    if (isAnimating == false) {
        isAnimating = true;
        curve.setAnimation(true);
        draw(curve);
        curve.setAnimation(false);
        deCasteljauAnimate.style.background = "#33cc33";
        deCasteljauAnimate.innerHTML = "Animating";
        var timeoutTime = 1;
        var counter = curve.control_points.length;
        while (counter > 2) {
            counter--;
            timeoutTime += counter;
        }
        timeoutTime = timeoutTime * 775;
        setTimeout(function() {
            deCasteljauAnimate.style.background = "#E9ECEF";
            deCasteljauAnimate.innerHTML = "Animate";
            isAnimating = false;
        }, timeoutTime);
    }
});