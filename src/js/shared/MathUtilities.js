function MathUtilities() {
    
    var radianToDegree = function(radian) {
        return radian * 180 / Math.PI;
    }
    
    var degreeToRadian = function(degree) {
       return degree * Math.PI / 180;
    }

    var slopeOfLineBetweenTwoPoints = function(x1, y1, x2, y2) {
        if(x1 != x2) {
            return (y2 - y1) / (x2 - x1);
        } else {
            return Infinity;
        }
    }

    var getZoneOfGivenVector = function(x1, y1, x2, y2) {
        const cxDiff = x2 - x1;
        const cyDiff = y2 - y1;
        if (cxDiff > 0 && cyDiff >= 0) {
            return 1;
        } else if (cxDiff <= 0 && cyDiff > 0) {
            return 2;
        } else if (cxDiff < 0 && cyDiff <= 0) {
            return 3;
        } else if (cxDiff >= 0 && cyDiff < 0) {
            return 4;
        } else {
            return 0;
        }
    }
    
    this.convertCoordinatesToCartesianCoordinateSystem = function(x, y) {
        return {x: x, y: -y}
    }
    this.cartesianPointToCanvasPoint = function(x, y) {
        return {x: x, y: -y}
    }
    this.getDegreeOfGivenVector = function(x1, y1, x2, y2) {
        const slopeOfLine = slopeOfLineBetweenTwoPoints(x1, y1, x2, y2);
        const alfaDegreeInTriangle = Math.abs(radianToDegree(Math.atan(slopeOfLine)))
        const vectorZoneInCartesianSystem = getZoneOfGivenVector(x1, y1, x2, y2);
        if(vectorZoneInCartesianSystem == 1) {
            return alfaDegreeInTriangle;
        } else if(vectorZoneInCartesianSystem == 2) {
            return (180-alfaDegreeInTriangle);
        } else if(vectorZoneInCartesianSystem == 3) {
            return (180+alfaDegreeInTriangle);
        } else if(vectorZoneInCartesianSystem == 4) {
            return (360-alfaDegreeInTriangle);
        } else {
            return 0;
        }
    }
    this.calculateNewCoordinatePointsFromGivenPointLineLengthAndDegrees = function(x1, y1, lineLength, degrees) {
        const dx = Math.cos(degreeToRadian(degrees)) * lineLength;
        const dy = Math.sin(degreeToRadian(degrees)) * lineLength;

        const nx = x1 + dx;
        const ny = y1 + dy;

        return {
            x: nx,
            y: ny
        }
    }
}