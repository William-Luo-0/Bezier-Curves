/**
 * Bezier is a set of functions that create bezier curve on canvas
 */

function Bezier () {

    this.control_points = [];

    this.curve_mode = "Basic";
    this.continuity_mode = "C0";
    this.subdivide_level = 0;
    this.piecewise_degree = 1;
    this.deCasteljau_t = 0.5;
    this.animationBoolean = false;
    
    /** ---------------------------------------------------------------------
     * Evaluate the Bezier curve at the given t parameter
     * @param t Given t parameter
     * @return Vector2D The location of point at given t parameter
     */
    this.evaluate = function (t) {
        if (t >= 0.0 && t <= 1.000005) {
            if (this.control_points.length > 1) {

                // You may find the following functions useful"
                //  - this.binomialCoefficient(m, i) computes "m choose i", aka: (m over i)
                //  - Math.pow(t, i) computes t raised to the power i
                var totalX = 0;
                var totalY = 0;
                var i = this.control_points.length;
                var m = this.control_points.length - 1;
                while (i > 0) {
                    i = i - 1;
                    totalX += this.control_points[i].x * this.binomialCoefficient(m,i) * Math.pow(t,i) * Math.pow(1-t,m-i);
                    totalY += this.control_points[i].y * this.binomialCoefficient(m,i) * Math.pow(t,i) * Math.pow(1-t,m-i);
                }

                return new Vector2D(totalX, totalY);
            }
        }
    };

    /** ---------------------------------------------------------------------
     * Subdivide this Bezier curve into two curves
     * @param curve1 The first curve
     * @param curve2 The second curve
     */
    this.subdivide = function (curve1, curve2) {
        if (this.control_points.length > 0) {
            curve1.control_points.push(this.control_points[0]);
            curve2.control_points.push(this.control_points[this.control_points.length-1]);
            var new_points = [];

            for (var i = 0; i < this.control_points.length; i++) {
                new_points.push(this.control_points[i]);
            }
            
            while (new_points.length > 1) {
                var newPointLength = new_points.length-1;
                var next_points = [];
                for (var i = 0; i < newPointLength; i++) {
                    var firstX = new_points[i].x;
                    var firstY = new_points[i].y;
                    var secondX = new_points[i+1].x;
                    var secondY = new_points[i+1].y;
                    var totalX = (firstX + secondX) / 2;
                    var totalY = (firstY + secondY) / 2;
                    next_points.push(new Vector2D(totalX, totalY));
                    if (i == 0) {
                        curve1.control_points.push(new Vector2D(totalX, totalY));
                    }
                    if (i == newPointLength-1) {
                        curve2.control_points.push(new Vector2D(totalX, totalY));
                    }
                }
                new_points = next_points.slice(0);
            }
        }
    };

    this.animateSubdivision = function (pointArray) {
        var new_points = []

        for (var i = 0; i < this.control_points.length; i++) {
            new_points.push(this.control_points[i]);
        }

        while (new_points.length > 1) {
            var next_points = [];
            for (var i = 0; i < new_points.length - 1; i++) {
                var totalX = (new_points[i+1].x * this.deCasteljau_t) + (new_points[i].x * (1 - this.deCasteljau_t));
                var totalY = (new_points[i+1].y * this.deCasteljau_t) + (new_points[i].y * (1 - this.deCasteljau_t));
                next_points.push(new Vector2D(totalX, totalY));
            }
            pointArray.push(next_points);
            new_points = next_points.slice(0);
        }
        var final_point = [];
        final_point.push(new_points[0]);

        pointArray.push(final_point);
    };

    this.sleep = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /** ---------------------------------------------------------------------
     * Draw this Bezier curve
     */
    this.drawCurve = async function () {
        if (this.control_points.length >= 2) {

            if (this.curve_mode == "Basic") {
                // Basic Mode
                //
                // Create a Bezier curve from the entire set of control points,
                // and then simply draw it to the screen

                // Do this by evaluating the curve at some finite number of t-values,
                // and drawing line segments between those points.
                // You may use the this.drawLine() function to do the actual
                // drawing of line segments.

                var t = 0;
                while (t != 1) {
                    this.drawLine(this.evaluate(t), this.evaluate(t+0.01));
                    t += 0.01;
                }
            }
            else if (this.curve_mode == "Subdivision") {
                // Subdivision mode
                //
                // Create a Bezier curve from the entire set of points,
                // then subdivide it the number of times indicated by the
                // this.subdivide_level variable.
                // The control polygons of the subdivided curves will converge
                // to the actual bezier curve, so we only need to draw their
                // control polygons.

                if (this.subdivide_level == 0) {
                    this.drawControlPolygon();
                } else {
                    var beziers = [];
                    var curve1 = new Bezier();
                    var curve2 = new Bezier();
                    this.subdivide(curve1, curve2);
                    beziers.push(curve1);
                    beziers.push(curve2);

                    for (var j = 1; j < this.subdivide_level; j++) {
                        var bezierLength = beziers.length;
                        while (bezierLength > 0) {
                            var curve_sub1 = new Bezier();
                            var curve_sub2 = new Bezier();
                            var currentBezier = beziers.shift();
                            currentBezier.subdivide(curve_sub1,curve_sub2);
                            beziers.push(curve_sub1);
                            beziers.push(curve_sub2);
                            bezierLength--;
                        }
                    }
                    for (var k = 0; k < beziers.length; k++) {
                        for (var i = 0; i < beziers[k].control_points.length - 1; i++) {
                            this.drawLine(beziers[k].control_points[i], beziers[k].control_points[i+1]);
                        }
                    }
                }
            }
            else if (this.curve_mode == "Piecewise") {
                if (this.continuity_mode == "C0")
                {
                    // C0 continuity
                    //
                    // Each piecewise curve should be C0 continuous with adjacent
                    // curves, meaning they should share an endpoint.

                    var currentIndex = 0;
                    var controlLength = this.control_points.length;
                    var beziers = [];

                    while (controlLength > this.piecewise_degree) {
                        var newBezier = new Bezier();
                        for (var i = 0; i <= this.piecewise_degree; i++) {
                            newBezier.control_points.push(this.control_points[currentIndex]);
                            if (i == this.piecewise_degree) {
                                // Nothing
                            } else {
                                currentIndex++;
                                controlLength--;
                            }
                        }
                        beziers.push(newBezier);
                    }
                    var lastBezier = new Bezier();
                    while (currentIndex < this.control_points.length) {
                        lastBezier.control_points.push(this.control_points[currentIndex]);
                        currentIndex++;
                    }
                    beziers.push(lastBezier);

                    for (var i = 0; i < beziers.length; i++) {
                        for (var j = 0; j < 1; j += 0.01) {
                            this.drawLine(beziers[i].evaluate(j), beziers[i].evaluate(j+0.01));
                        }
                    }
                }
                else if (this.continuity_mode == "C1")
                {
                    // C1 continuity
                    //
                    // Each piecewise curve should be C1 continuous with adjacent
                    // curves.  This means that not only must they share an endpoint,
                    // they must also have the same tangent at that endpoint.
                    // You will likely need to add additional control points to your
                    // Bezier curves in order to enforce the C1 property.
                    // These additional control points do not need to show up onscreen.
                    if (this.piecewise_degree < 2) {
                        this.drawControlPolygon(); // Not enough degrees of freedom
                    }
                    else if (this.control_points.length > this.piecewise_degree + 1) {
                        var controlLength = this.control_points.length;
                        var beziers = [];
                        var currentIndex = 0;

                        var firstBezier = new Bezier(); // First bezier interpolates endpoint
                        while (firstBezier.control_points.length < this.piecewise_degree) {
                            firstBezier.control_points.push(this.control_points[currentIndex]);
                            currentIndex++;
                            controlLength--;
                        }
                        var totalX = (this.control_points[currentIndex-1].x + this.control_points[currentIndex].x) / 2;
                        var totalY = (this.control_points[currentIndex-1].y + this.control_points[currentIndex].y) / 2;
                        firstBezier.control_points.push(new Vector2D(totalX, totalY));
                        beziers.push(firstBezier);

                        while (controlLength > this.piecewise_degree) { // Middle beziers have starting and end point between two control points at the middle
                            var nextBezier = new Bezier();
                            nextBezier.control_points.push(new Vector2D(totalX, totalY));
                            for (var i = 0; i < this.piecewise_degree - 1; i++) {
                                nextBezier.control_points.push(this.control_points[currentIndex]);
                                currentIndex++;
                                controlLength--;
                            }
                            totalX = (this.control_points[currentIndex-1].x + this.control_points[currentIndex].x) / 2;
                            totalY = (this.control_points[currentIndex-1].y + this.control_points[currentIndex].y) / 2;
                            nextBezier.control_points.push(new Vector2D(totalX,totalY));
                            beziers.push(nextBezier);
                        }

                        var lastBezier = new Bezier(); // Last bezier interpolates endpoint
                        lastBezier.control_points.push(new Vector2D(totalX, totalY));
                        while (currentIndex < this.control_points.length) {
                            lastBezier.control_points.push(this.control_points[currentIndex]);
                            currentIndex++;
                        }
                        beziers.push(lastBezier);

                        for (var i = 0; i < beziers.length; i++) {
                            for (var j = 0; j < 1; j += 0.01) {
                                this.drawLine(beziers[i].evaluate(j), beziers[i].evaluate(j+0.01));
                            }
                        }
                    }
                    else { // Degree higher than control points
                        var t = 0;
                        while (t != 1) {
                            this.drawLine(this.evaluate(t), this.evaluate(t+0.01));
                            t += 0.01;
                        }
                    }
                }
            }
            else if (this.curve_mode == "De Casteljau") {
                var pointArray = [];
                this.animateSubdivision(pointArray);

                this.drawSetup();
                this.drawControlPoints();
                if (this.animationBoolean) {
                    var arrayPair = [];
                    await this.sleep(1200);
                    this.drawSetup();
                    this.drawControlPoints();
                    for (var i = 0; i < pointArray.length - 1; i++) {
                        this.gl_operation.drawPoints(pointArray[i]);
                        await this.sleep(750);
                        this.drawSetup();
                        this.drawControlPoints();
                        for (var l = 0; l <= i; l++) {
                            this.gl_operation.drawPoints(pointArray[l]);
                        }
                        for (var k = 0; k < arrayPair.length; k++) {
                            this.drawLine(arrayPair[k][0],arrayPair[k][1]);
                        }
                        for (var j = 0; j < pointArray[i].length-1; j++) {
                            var pairValue = [];
                            pairValue.push(pointArray[i][j]);
                            pairValue.push(pointArray[i][j+1]);
                            arrayPair.push(pairValue);
                            this.drawLine(pointArray[i][j],pointArray[i][j+1]);
                            await this.sleep(750);
                            this.drawSetup();
                            this.drawControlPoints();
                            for (var l = 0; l <= i; l++) {
                                this.gl_operation.drawPoints(pointArray[l]);
                            }
                            for (var k = 0; k < arrayPair.length; k++) {
                                this.drawLine(arrayPair[k][0],arrayPair[k][1]);
                            }
                        }
                    }

                    this.gl_operation.drawPoints(pointArray[pointArray.length-1]);
                }
            }
        }
    };

    /** ---------------------------------------------------------------------
     * Draw line segment between point p1 and p2
     */
    this.drawLine = function (p1, p2) {
        this.gl_operation.drawLine(p1, p2);
    };


    /** ---------------------------------------------------------------------
     * Draw control polygon
     */
    this.drawControlPolygon = function () {
        if (this.control_points.length >= 2) {
            for (var i = 0; i < this.control_points.length - 1; i++) {
                this.drawLine(this.control_points[i], this.control_points[i + 1]);
            }
        }
    };

    /** ---------------------------------------------------------------------
     * Draw control points
     */
    this.drawControlPoints = function () {
        this.gl_operation.drawPoints(this.control_points);
    };


    /** ---------------------------------------------------------------------
     * Drawing setup
     */
    this.drawSetup = function () {
        this.gl_operation.drawSetup();
    };


    /** ---------------------------------------------------------------------
     * Compute nCk ("n choose k")
     * WARNING:: Vulnerable to overflow when n is very large!
     */
    this.binomialCoefficient = function (n, k) {
        var result = -1;

        if (k >= 0 && n >= k) {
            result = 1;
            for (var i = 1; i <= k; i++) {
                result *= n - (k - i);
                result /= i;
            }
        }

        return result;
    };


    /** ---------------------------------------------------------------------
     * Setters
     */
    this.setGL = function (gl_operation) {
        this.gl_operation = gl_operation;
    };

    this.setCurveMode = function (curveMode) {
        this.curve_mode = curveMode;
    };

    this.setContinuityMode = function (continuityMode) {
        this.continuity_mode = continuityMode;
    };

    this.setSubdivisionLevel = function (subdivisionLevel) {
        this.subdivide_level = subdivisionLevel;
    };

    this.setPiecewiseDegree = function (piecewiseDegree) {
        this.piecewise_degree = piecewiseDegree;
    };

    this.setDeCasteljauT = function (tvalue) {
        this.deCasteljau_t = tvalue;
    };

    this.setAnimation = function (yesno) {
        this.animationBoolean = yesno;
    }

    /** ---------------------------------------------------------------------
     * Getters
     */
    this.getCurveMode = function () {
        return this.curve_mode;
    };

    this.getContinuityMode = function () {
        return this.continuity_mode;
    };

    this.getSubdivisionLevel = function () {
        return this.subdivide_level;
    };

    this.getPiecewiseDegree = function () {
        return this.piecewise_degree;
    };

    this.getDeCasteljauT = function() {
        return this.deCasteljau_t;
    };

    /** ---------------------------------------------------------------------
     * @return Array A list of control points
     */
    this.getControlPoints = function () {
        return this.control_points;
    };


    /** ---------------------------------------------------------------------
     * @return Vector2D chosen point
     */
    this.getControlPoint = function (idx) {
        return this.control_points[idx];
    };

    /** ---------------------------------------------------------------------
     * Add a new control point
     * @param new_point Vector2D A 2D vector that is added to control points
     */
    this.addControlPoint = function (new_point) {
        this.control_points.push(new_point);
    };

    /** ---------------------------------------------------------------------
     * Remove a control point
     * @param point Vector2D A 2D vector that is needed to be removed from control points
     */
    this.removeControlPoint = function (point) {
        var pos =  this.points.indexOf(point);
        this.control_points.splice(pos, 1);
    };

    /** ---------------------------------------------------------------------
     * Remove all control points
     */
    this.clearControlPoints = function() {
        this.control_points = [];
    };

    /** ---------------------------------------------------------------------
     * Print all control points
     */
    this.printControlPoints = function() {
        this.control_points.forEach(element => {
            element.printVector();
        });
    };
}