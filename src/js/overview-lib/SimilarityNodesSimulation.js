function SimilarityNodesSimulation(chartToAttach, firstJointCoords, secondJointPos, degreeOfConnectionLine, similarityNodeDegree, similarityNodeLineLength, similarityNodeRadius, similarityValues, similarityTypeColorList) {
    this.mathUtil = new MathUtilities();

    this.chart = chartToAttach.append("g");

    const textSimilarityName = "Text";
    const citationSimilarityName = "Citation";
    const imageSimilarityName = "Image";
    const formulaSimilarityName = "Formula";

    const matchedDocumentsColorScale = d3.scaleOrdinal()
        .domain([textSimilarityName, citationSimilarityName, imageSimilarityName, formulaSimilarityName])
        .range(similarityTypeColorList);

    this.simulationConfig = {
        firstJointCoords: {
            x: firstJointCoords.x,
            y: firstJointCoords.y
        },
        secondJointPos: {
            x: secondJointPos.x,
            y: secondJointPos.y
        },
        degreeOfConnectionLine: degreeOfConnectionLine,
        similarityNodeDegree: similarityNodeDegree,
        similarityNodeLineLength: similarityNodeLineLength,
        similarityNodeRadius: similarityNodeRadius,
        simulationInitializationDurationMs: 500,
        activeColor: "#0D82E6",
        inactiveColor: "#000",
        strokeWidthOfLines: "2",
        minimumRadius: "2"
    }

    this.similarityValues = {
        textValue: similarityValues.textValue,
        citationValue: similarityValues.citationValue,
        imageValue: similarityValues.imageValue,
        formulaValue: similarityValues.formulaValue
    }

    this.simulationDataModel = [
        {
            "name": textSimilarityName,
            "value": similarityValues.textValue,
            "jointCoords": this.simulationConfig.firstJointCoords,
            "similarityNodeDegree": this.simulationConfig.similarityNodeDegree,
            "x": 0,
            "y": 0,
            "initx": 0,
            "inity": 0
        },
        {
            "name": citationSimilarityName,
            "value": similarityValues.citationValue,
            "jointCoords": this.simulationConfig.firstJointCoords,
            "similarityNodeDegree": -this.simulationConfig.similarityNodeDegree,
            "x": 0,
            "y": 0,
            "initx": 0,
            "inity": 0
        },
        {
            "name": imageSimilarityName,
            "value": similarityValues.imageValue,
            "jointCoords": this.simulationConfig.secondJointPos,
            "similarityNodeDegree": this.simulationConfig.similarityNodeDegree,
            "x": 0,
            "y": 0,
            "initx": 0,
            "inity": 0
        },
        {
            "name": formulaSimilarityName,
            "value": similarityValues.formulaValue,
            "jointCoords": this.simulationConfig.secondJointPos,
            "similarityNodeDegree": -this.simulationConfig.similarityNodeDegree,
            "x": 0,
            "y": 0,
            "initx": 0,
            "inity": 0
        }
    ];

    this.linkData = null;

    var max = d3.max([this.similarityValues.textValue, this.similarityValues.citationValue, this.similarityValues.imageValue, this.similarityValues.formulaValue]);
    this.radiusScale = d3.scaleLinear().domain([0, max]).range([this.simulationConfig.minimumRadius, this.simulationConfig.similarityNodeRadius]);

    var generateLinkData = function(simulationDataModel) {
        var animLinkData = []
        simulationDataModel.forEach(function(d){
            animLinkData.push({
                source: {
                    x: 0,
                    y: 0
                },
                target: {
                    x: 0,
                    y: 0
                },
                init: {
                    source: {
                        x: d.jointCoords.y,
                        y: d.jointCoords.x
                    },
                    target: {
                        x: d.inity,
                        y: d.initx
                    },
                },
                final: {
                    source: {
                        x: d.jointCoords.y,
                        y: d.jointCoords.x
                    },
                    target: {
                        x: d.y,
                        y: d.x
                    },
                }
            })
        })
        return animLinkData;
    };

    var updateLinkData = function(simulationDataModel, linkDataList) {
        simulationDataModel.forEach(function(d, i) {
            var currentLinkData = linkDataList[i];

            currentLinkData.source.x = d.jointCoords.y;
            currentLinkData.source.y = d.jointCoords.x;

            currentLinkData.target.x = d.y;
            currentLinkData.target.y = d.x;

            currentLinkData.init.source.x = d.jointCoords.y;
            currentLinkData.init.source.y = d.jointCoords.x;

            currentLinkData.init.target.x = d.inity;
            currentLinkData.init.target.y = d.initx;

            currentLinkData.final.source.x = d.jointCoords.y;
            currentLinkData.final.source.y = d.jointCoords.x;

            currentLinkData.final.target.x = d.y;
            currentLinkData.final.target.y = d.x;
        })
    }

    var calculateCoordinatesForNode = function(jointCoords, combinedDegrees, nodeDistance, self) {
        const jointPosCartesian = self.mathUtil.convertCoordinatesToCartesianCoordinateSystem(jointCoords.x, jointCoords.y);
        const nodePosCartesian = self.mathUtil.calculateNewCoordinatePointsFromGivenPointLineLengthAndDegrees(
            jointPosCartesian.x,
            jointPosCartesian.y,
            nodeDistance,
            combinedDegrees
        );
        const nodePos = self.mathUtil.cartesianPointToCanvasPoint(nodePosCartesian.x, nodePosCartesian.y);
        return {
            x: nodePos.x,
            y: nodePos.y
        }
    }

    var setPreAnimationCoordinatesOfAllNodes = function(self) {
        for (var i = 0, len = self.simulationDataModel.length; i < len; i++) {
            const d = self.simulationDataModel[i];
            const nodeDistance = self.simulationConfig.similarityNodeLineLength;
            const nodeCoords = calculateCoordinatesForNode(d.jointCoords, self.simulationConfig.degreeOfConnectionLine, nodeDistance, self);
            d.initx = nodeCoords.x;
            d.inity = nodeCoords.y;
        }
    }

    var setPositionsOfAllNodes = function(self) {
        for (var i = 0, len = self.simulationDataModel.length; i < len; i++) {
            const d = self.simulationDataModel[i];
            var nodeDistance = 0;
            if(i == 0 || i == 1) {
                nodeDistance = self.simulationConfig.similarityNodeLineLength * 2;
            } else {
                nodeDistance = self.simulationConfig.similarityNodeLineLength;
            }
            const combinedDegrees = self.simulationConfig.degreeOfConnectionLine + d.similarityNodeDegree;
            const nodeCoords = calculateCoordinatesForNode(d.jointCoords, combinedDegrees, nodeDistance, self);
            d.x = nodeCoords.x;
            d.y = nodeCoords.y;
        }
    }

    var handleMouseOver = function(self, d) {
        d.isNodeHoveredOn = true;
        redraw(self);
    }

    var handleMouseOut = function(self, d) {
        d.isNodeHoveredOn = false;
        redraw(self);
    }

    var horizontalLink = d3.linkHorizontal()
    .x(function(d) { return d.y; })
    .y(function(d) { return d.x; });
    
    var initializeSimulation = function(self) {
        self.linkData = generateLinkData(self.simulationDataModel);

        self.chart.selectAll('path')
            .data(self.linkData).join("path")
            .attr("fill", "none")
            .attr("stroke", self.simulationConfig.inactiveColor)
            .style("stroke-width", function(d) {
                return "0"
            })
            .each(function(d){
                d.source.x = d.init.source.x;
                d.source.y = d.init.source.y;

                d.target.x = d.init.target.x;
                d.target.y = d.init.target.y;
            })
            .attr("d", horizontalLink)
            .transition().duration(self.simulationConfig.simulationInitializationDurationMs)
            .attr("stroke", self.simulationConfig.activeColor)
            .style("stroke-width", function(d) {
                return self.simulationConfig.strokeWidthOfLines;
            })
            .each(function(d){
                d.source.x = d.final.source.x;
                d.source.y = d.final.source.y;

                d.target.x = d.final.target.x;
                d.target.y = d.final.target.y;
            })
            .attr("d", horizontalLink)

        self.chart.selectAll("circle")
            .data(self.simulationDataModel).join("circle")
            .on("mouseover", function(d){
                handleMouseOver(self, d);
            })
            .on("mouseout", function(d){
                handleMouseOut(self, d);
            })
            .attr("cx", d => d.initx)
            .attr("cy", d => d.inity)
            .style("stroke", "black")
            .style("fill", self.simulationConfig.inactiveColor)
            .attr("r", "0")
            .transition().duration(self.simulationConfig.simulationInitializationDurationMs)
            .style("fill", d => matchedDocumentsColorScale(d.name))
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", function(d, i) {
                return self.radiusScale(d.value);
            })

        self.chart.selectAll("text")
            .data(self.simulationDataModel).enter()
            .append("text")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "baseline")
            .attr("fill", d => matchedDocumentsColorScale(d.name))
            .attr("font-size", "7.5px")
            .attr("cursor", "default")
            .text(d => d.name)
            .attr("x", d => d.x)
            .attr("y", d => (d.y - self.radiusScale(d.value) * 1.25))
            .style("opacity", function(d){
                if(d.isNodeHoveredOn) {
                    return "1"
                } else {
                    return "0";
                }
            })
    }

    var redraw = function(self) {
        self.chart.selectAll("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)

        self.chart.selectAll('path')
            .each(function(d){
                d.source.x = d.final.source.x;
                d.source.y = d.final.source.y;

                d.target.x = d.final.target.x;
                d.target.y = d.final.target.y;
            })
            .attr("d", horizontalLink)
        
        self.chart.selectAll("text")
            .attr("x", d => d.x)
            .attr("y", d => (d.y - self.radiusScale(d.value) * 1.25))
            .transition().duration(self.simulationConfig.simulationInitializationDurationMs)
            .style("opacity", function(d){
                if(d.isNodeHoveredOn) {
                    return "1"
                } else {
                    return "0";
                }
            })
    }

    var finalizeSimulation = function(self, callback) {
        self.chart.selectAll("circle")
            .transition().duration(self.simulationConfig.simulationInitializationDurationMs)
            .style("fill", self.simulationConfig.inactiveColor)
            .attr("cx", d => d.initx)
            .attr("cy", d => d.inity)
            .attr("r", "0")

        self.chart.selectAll('path')
            .transition().duration(self.simulationConfig.simulationInitializationDurationMs)
            .style("stroke", self.simulationConfig.inactiveColor)
            .style("stroke-width", function(d) {
                return "0"
            })
            .each(function(d){
                d.source.x = d.init.source.x;
                d.source.y = d.init.source.y;

                d.target.x = d.init.target.x;
                d.target.y = d.init.target.y;
            })
            .attr("d", horizontalLink)
            .on("end", callback);
    }
    
    setPreAnimationCoordinatesOfAllNodes(this);
    setPositionsOfAllNodes(this);
    initializeSimulation(this);

    this.updateSimilarityValues = function(citationValue, textValue, formulaValue, imageValue) {

    }
    
    this.updateSimulation = function(firstJointCoords, secondJointPos) {
        this.simulationDataModel.forEach(function(d){
            d.jointCoords.x = firstJointCoords.x;
            d.jointCoords.y = firstJointCoords.y;
        })

        for (var i = 0, len = this.simulationDataModel.length; i < len; i++) {
            const d =  this.simulationDataModel[i];            
            if(i < 2) {
                d.jointCoords.x = firstJointCoords.x;
                d.jointCoords.y = firstJointCoords.y;
            } else {
                d.jointCoords.x = secondJointPos.x;
                d.jointCoords.y = secondJointPos.y;
            }
        }

        setPreAnimationCoordinatesOfAllNodes(this);
        setPositionsOfAllNodes(this);
        updateLinkData(this.simulationDataModel, this.linkData)
        redraw(this);
    }

    this.destroy = function(callback) {
        var chart = this.chart;
        var isAlreadyDestroyed = false;
        finalizeSimulation(this, function(){
            if(!isAlreadyDestroyed) {
                chart.remove();
                if(callback) callback();
                isAlreadyDestroyed = true;
            }
        });
    }
}