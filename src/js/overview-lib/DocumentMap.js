function DocumentMap(canvasId, defaultNodeColor, matchedDocRadius, nodeDistanceMultiplier, nodeRepulsionStrength, mapXScale, mapYScale, minZoom, maxZoom, backgroundColor, similarityTypeColorList) {
    var NODES = [];
    var LINKS = [];


    var SVG = null;
    var SIM = null;
    var CHART = null;
    var SUB_CHART = null;

    var MAP_X_SCALE = mapXScale;
    var MAP_Y_SCALE = mapYScale;

    var MAP_SIZE = MAP_X_SCALE + ':' + MAP_Y_SCALE;
    var MAP_TRANSLATION_X = 0;
    var MAP_TRANSLATION_Y = 0;
    var ZOOM_SCALE = 1;
    const MIN_ZOOM = minZoom;
    const MAX_ZOOM = maxZoom;
    const BACKGROUND_COLOR = backgroundColor;

    var SIMILARITY_THRESHOLD = 30;

    const lineThicknessScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, 10]);

    const matchedDocumentsColorScale = d3.scaleQuantize()
        .domain([0, 100])
        .range(["rgb(216,234,255)", "rgb(163,194,230)", "rgb(112,148,193)", "rgb(22,68,128)", "rgb(31,51,87)"]);

    const similarityNodesDegreeScale = d3.scaleQuantize()
        .domain([0, 100])
        .range([45, 60]);

    var USER_NODE_CLICKED_CALLBACK = null;
    var NODE_POSITION_UPDATED_CALLBACK = null;
    var NODE_MOUSE_OVER_CALLBACK = null;
    var NODE_MOUSE_OUT_CALLBACK = null;
    var NODE_VISIBILITY_CHANGED_CALLBACK = null;
    var MAP_MOUSE_OVER_CALLBACK = null;
    var MAP_MOUSE_OUT_CALLBACK = null;

    const ROOT_INDEX = 0;
    const COLOR_TRANSITION_DURATION = 500;

    const NODE_REPULSION_STRENGTH = nodeRepulsionStrength;
    const NODE_DISTANCE_MULTIPLIER = nodeDistanceMultiplier;
    const DEFAULT_NODE_COLOR = defaultNodeColor;

    const MATCHED_DOC_RADIUS = matchedDocRadius;
    const SOURCE_DOC_RADIUS = matchedDocRadius * 1.5;

    const ADDITIONAL_DISTANCE_BETWEEN_TARGET_AND_SOURCE_DOC = SOURCE_DOC_RADIUS;

    var nodeClickedCallback = function(d, i) {
        if (USER_NODE_CLICKED_CALLBACK) {
            if (!d.target) {
                USER_NODE_CLICKED_CALLBACK(d.nodeId);
            } else {
                USER_NODE_CLICKED_CALLBACK(d.target.nodeId);
            }
        }
    }

    var circlePositionUpdatedCallback = function(nodeId, cx, cy) {
        const backgroundRectSize = d3.selectAll("rect").node().getBoundingClientRect();
        var x = d3.scaleLinear()
            .domain([0, MAP_X_SCALE * ZOOM_SCALE])
            .range([0, backgroundRectSize.width]);
        var y = d3.scaleLinear()
            .domain([0, MAP_Y_SCALE * ZOOM_SCALE])
            .range([0, backgroundRectSize.height]);

        if (NODE_POSITION_UPDATED_CALLBACK)
            NODE_POSITION_UPDATED_CALLBACK(nodeId, x(cx) * ZOOM_SCALE, y(cy) * ZOOM_SCALE);
    }

    var zoomedCallback = function() {
        MAP_TRANSLATION_X = d3.event.transform.x;
        MAP_TRANSLATION_Y = d3.event.transform.y;
        ZOOM_SCALE = d3.event.transform.k;
        CHART.attr("transform", "translate(" + MAP_TRANSLATION_X + "," + MAP_TRANSLATION_Y + ") scale(" + ZOOM_SCALE + ")");
        SUB_CHART.attr("transform", "translate(" + MAP_TRANSLATION_X + "," + MAP_TRANSLATION_Y + ") scale(" + ZOOM_SCALE + ")");

        CHART.selectAll("circle")
            .each(function(d, i) {
                var self = d3.select(this);
                d.cx = parseFloat(self.attr("cx"));
                d.cy = parseFloat(self.attr("cy"));
                d.absoluteX = d.cx * ZOOM_SCALE + parseFloat(MAP_TRANSLATION_X);
                d.absoluteY = d.cy * ZOOM_SCALE + parseFloat(MAP_TRANSLATION_Y);
                circlePositionUpdatedCallback(d.nodeId, d.absoluteX, d.absoluteY);
            })
    }

    var handleMouseOver = function(d, i) {
        if (NODE_MOUSE_OVER_CALLBACK) {
            if (!d.target) {
                NODE_MOUSE_OVER_CALLBACK(d.nodeId);
            } else {
                NODE_MOUSE_OVER_CALLBACK(d.target.nodeId);
            }
        }
    }

    var handleMouseOut = function(d, i) {
        if (NODE_MOUSE_OUT_CALLBACK) {
            if (!d.target) {
                NODE_MOUSE_OUT_CALLBACK(d.nodeId);
            } else {
                NODE_MOUSE_OUT_CALLBACK(d.target.nodeId);
            }
        }
    }

    var handleMapMouseOver = function(d, i) {
        if(MAP_MOUSE_OVER_CALLBACK) {
            MAP_MOUSE_OVER_CALLBACK();
        }
    }

    var handleMapMouseOut = function(d, i) {
        if(MAP_MOUSE_OUT_CALLBACK) {
            MAP_MOUSE_OUT_CALLBACK();
        }
    }

    var getPositionOfSimilarityNodeSimulation = function(nodeId) {
        var node = getNode(nodeId);

        const targetDocPos = {
            x: node.cx,
            y: node.cy
        }

        const sourceDocPos = {
            x: NODES[ROOT_INDEX].cx,
            y: NODES[ROOT_INDEX].cy,
        }

        const firstJointPos = {
            x: ((targetDocPos.x + sourceDocPos.x) / 2),
            y: ((targetDocPos.y + sourceDocPos.y) / 2)
        }
        const secondJointPos = {
            x: ((targetDocPos.x + sourceDocPos.x) / 1.75),
            y: ((targetDocPos.y + sourceDocPos.y) / 1.75)
        }

        return {
            firstJointPos: firstJointPos,
            secondJointPos: secondJointPos
        };
    }

    var getNode = function(nodeId) {
        var nodeData = null;
        NODES.forEach(function(node){
            if(node.nodeId == nodeId) {
                nodeData = node;
            }
        })
        return nodeData;
    }

    function updateNodeSimilaritySimulation(){
        NODES.forEach(function(node, i){
            if(node.similarityNodeSimulation) {
                const pos = getPositionOfSimilarityNodeSimulation(node.nodeId);
                node.similarityNodeSimulation.updateSimulation(pos.firstJointPos, pos.secondJointPos);
            }
        })
    }

    function ticked() {
        var transitionDuration = 50;
        redraw(transitionDuration, CHART, DEFAULT_NODE_COLOR, SIMILARITY_THRESHOLD, ZOOM_SCALE, MAP_TRANSLATION_X, MAP_TRANSLATION_Y, nodeVisibilityChangedMiddleware);
    }

var LINE_GROUP = null;
var CIRCLE_GROUP = null;
var TEXT_GROUP = null;

    function draw(chart, nodes, links, matchedDocRadius, sourceDocRadius, defaultNodeColor) {
        
        LINE_GROUP = chart.selectAll('line')
            .data(links).enter()
            .append('line')
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", nodeClickedCallback)
            .attr("x1", d => d.source.x)
            .attr("x2", d => d.target.x)
            .attr("y1", d => d.source.y)
            .attr("y2", d => d.target.y)
            .attr("cursor", "pointer")
            .style("fill", 'none')
            .style("stroke", function(d, i) {
                if (d.target.isStrokeHighlighted) {
                    return "#0D82E6"
                } else {
                    return matchedDocumentsColorScale(d.target.similarityPercentage);
                }
            })
            .style("stroke-width", function(d) {
                return lineThicknessScale(d.target.similarityPercentage);
            })
        CIRCLE_GROUP = chart.selectAll("circle")
            .data(nodes).join("circle")
            .on("click", nodeClickedCallback)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .attr("r", function(d, i) {
                if (d.type == "root") {
                    return sourceDocRadius;
                } else {
                    return matchedDocRadius;
                }
            })
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("cursor", "pointer")
            .style("fill", function(d, i) {
                if (d.isStrokeHighlighted) {
                    return "#0D82E6"
                } else {
                    return matchedDocumentsColorScale(d.similarityPercentage)
                }
            }) //#0D82E6
            .each(function(d, i) {
                var self = d3.select(this);
                d.cx = parseFloat(self.attr("cx"));
                d.cy = parseFloat(self.attr("cy"));
                circlePositionUpdatedCallback(d.nodeId, d.absoluteX, d.absoluteY);
            })

        TEXT_GROUP = chart.selectAll("text")
            .data(nodes).enter()
            .append("text")
            .on("click", nodeClickedCallback)
            .on("mouseover", handleMouseOver)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("fill", "white")
            .attr("cursor", "pointer")
            .style("font-size", "10px")
    }

    function redraw(transitionDuration, chart, defaultNodeColor, similarityThreshold, zoomScale, mapTranslationX, mapTranslationY, nodeVisibilityChangedCallback) {
        updateNodeSimilaritySimulation();

        LINE_GROUP
            .transition().duration(transitionDuration)
            .attr("x1", d => d.source.x)
            .attr("x2", d => d.target.x)
            .attr("y1", d => d.source.y)
            .attr("y2", d => d.target.y)
            .style("stroke", function(d, i) {
                if (d.target.isStrokeHighlighted) {
                    return "#0D82E6"
                } else {
                    return matchedDocumentsColorScale(d.target.similarityPercentage)
                }
            })
            .style("stroke-width", function(d) {
                return lineThicknessScale(d.target.similarityPercentage);
            }).style("opacity", function(d) {
                var self = d3.select(this);
                if (!d.target.forcedVisibility) {
                    if (d.target.similarityPercentage < similarityThreshold) {
                        return "0";
                    } else {
                        return "1";
                    }
                } else {
                    return "1";
                }
            })
        CIRCLE_GROUP
            .transition().duration(transitionDuration)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .style("fill", function(d, i) {
                if(d.type == "root") {
                    return "rgb(152,152,152)";
                } else {
                    if (d.isStrokeHighlighted) {
                        return "#0D82E6"
                    } else {
                        return matchedDocumentsColorScale(d.similarityPercentage)
                    }
                }
            })
            .style("stroke", function(d){
                if(d.type == "root") {
                    return "rgb(102,102,102)";
                } else {
                    return null;
                }
            })
            .each(function(d, i) {
                var self = d3.select(this);
                d.cx = parseFloat(self.attr("cx"));
                d.cy = parseFloat(self.attr("cy"));
                d.absoluteX = d.cx * zoomScale + parseFloat(mapTranslationX);
                d.absoluteY = d.cy * zoomScale + parseFloat(mapTranslationY);
                circlePositionUpdatedCallback(d.nodeId, d.absoluteX, d.absoluteY);
            }).style("opacity", function(d, i) {
                var self = d3.select(this);
                if (!d.forcedVisibility) {
                    if (d.similarityPercentage < similarityThreshold) {
                        const isVisible = false;
                        nodeVisibilityChangedCallback(d.nodeId, isVisible);
                        return "0";
                    } else {
                        const isVisible = true;
                        nodeVisibilityChangedCallback(d.nodeId, isVisible);
                        return "1";
                    }
                } else {
                    const isVisible = true;
                    nodeVisibilityChangedCallback(d.nodeId, isVisible);
                    return "1";
                }
            })

        TEXT_GROUP
            .transition().duration(transitionDuration)
            .text(function(d) {
                if (d.similarityPercentage >= 10) return "." + Math.trunc(d.similarityPercentage);
                else if (d.similarityPercentage < 10) return ".0" + Math.trunc(d.similarityPercentage);
                else return ""; //Used to hold text inside Source document node.
            })
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .style("opacity", function(d) {
                var self = d3.select(this);
                if (!d.forcedVisibility) {
                    if (d.similarityPercentage < similarityThreshold) {
                        return "0";
                    } else {
                        return "1";
                    }
                } else {
                    return "1";
                }
            })
    }

    function nodeVisibilityChangedMiddleware(nodeId, isVisible) {
        /*
        var node = NODES[nodeId];

        if(!isVisible && node.similarityNodeSimulation) {
            node.similarityNodeSimulation.destroy();
            node.similarityNodeSimulation = null;
        }
        */
        if(NODE_VISIBILITY_CHANGED_CALLBACK) {
            NODE_VISIBILITY_CHANGED_CALLBACK(nodeId, isVisible);
        }
    }

    this.initialize = function(sourceDoc, matchedDocs, overallSimilarities) {
        NODES.push({ type: "root", fx: 0, fy: 0, data: sourceDoc, rank: null, absoluteX: 0, absoluteY: 0, cx: 0, cy: 0, nodeId: sourceDoc.documentId, isStrokeHighlighted: false });

        var sortedOverallSimilarities = overallSimilarities.slice().sort(function(a, b) { return b - a })
        var overallSimilarityRanks = overallSimilarities.slice().map(function(v) { return sortedOverallSimilarities.indexOf(v) + 1 });
        console.log(overallSimilarities)

        matchedDocs.forEach(function(doc, i) {
            const currentLeafIndex = i + 1;
            const leafDistance = 100 - overallSimilarities[i];
            const nodeId = doc.documentId;
            NODES.push({ type: "leaf", data: doc, rank: overallSimilarityRanks[i], similarityPercentage: overallSimilarities[i], absoluteX: 0, absoluteY: 0, cx: 0, cy: 0, nodeId: nodeId, isStrokeHighlighted: false, forcedVisibility: false });
            LINKS.push({ source: ROOT_INDEX, target: currentLeafIndex, connectionStrength: 2, distance: leafDistance * NODE_DISTANCE_MULTIPLIER });
        });

        var aspectRatio = MAP_SIZE;
        const widthRatio = aspectRatio.split(':')[0];
        const heightRatio = aspectRatio.split(':')[1];
        var viewBox = '0 0 ' + widthRatio + " " + heightRatio;

        const referenceX = widthRatio / 2;
        const referenceY = heightRatio / 2;

        const zoomBehavior = d3.zoom()
            .on("zoom", zoomedCallback)
            .scaleExtent([MIN_ZOOM, MAX_ZOOM]);

        SVG = d3.select("#" + canvasId).append("svg").attr("width", "100%").attr("viewBox", viewBox);
        SVG.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", BACKGROUND_COLOR)
            .on("mouseover", handleMapMouseOver)
            .on("mouseout", handleMapMouseOut)

        CHART = SVG.append("g")
        SUB_CHART = SVG.append("g")

        SIM = d3.forceSimulation(NODES);
        SIM.alphaDecay(0.1)
        SIM.force("linkForce", d3.forceLink(LINKS).iterations(10).strength(d => d.connectionStrength).distance(function(d){
            const nodeDistance = d.distance * NODE_DISTANCE_MULTIPLIER;
            const nodeRadiusSumBetweenNodes = MATCHED_DOC_RADIUS + SOURCE_DOC_RADIUS;
            const minimumDistanceBetweenSourceAndTargetNodes = nodeRadiusSumBetweenNodes + ADDITIONAL_DISTANCE_BETWEEN_TARGET_AND_SOURCE_DOC;
            if (nodeDistance < minimumDistanceBetweenSourceAndTargetNodes) {
                return minimumDistanceBetweenSourceAndTargetNodes;
            } else {
                return nodeDistance;
            }
        }));
        SIM.force("collide", d3.forceCollide(MATCHED_DOC_RADIUS));
        SIM.force("manybody", d3.forceManyBody().strength(NODE_REPULSION_STRENGTH));
        SIM.on("tick", ticked);
        draw(CHART, NODES, LINKS, MATCHED_DOC_RADIUS, SOURCE_DOC_RADIUS, DEFAULT_NODE_COLOR);

        SVG.call(zoomBehavior).call(zoomBehavior.translateBy, referenceX, referenceY);
        //d3.select("#" + canvasId).call(zoomBehavior).call(zoomBehavior.translateBy, referenceX, referenceY)
    }
    this.setOverallSimilarities = function(overallSimilarities) {
        LINKS.forEach(function(linkObj, i) {
            linkObj.distance = (100 - overallSimilarities[i]) * NODE_DISTANCE_MULTIPLIER;
        });

        var sortedOverallSimilarities = overallSimilarities.slice().sort(function(a, b) { return b - a })
        var overallSimilarityRanks = overallSimilarities.slice().map(function(v) { return sortedOverallSimilarities.indexOf(v) + 1 });

        for (var i = 1; i < NODES.length; i++) {
            NODES[i].rank = overallSimilarityRanks[i - 1];
            NODES[i].similarityPercentage = overallSimilarities[i - 1];
        };

        SIM.force("linkForce")
            .links(LINKS) // binds new links to simulation
            .initialize(NODES);

        if (SIM.alpha() < .05) {
            SIM.alpha(.05);
            SIM.restart();
        }
    }
    this.setNodePositionUpdatedCallback = function(callback) {
        NODE_POSITION_UPDATED_CALLBACK = callback;
    }
    this.getZoomScale = function() {
        return ZOOM_SCALE;
    }
    this.updateSize = function(width, height) {
        MAP_X_SCALE = width;
        MAP_Y_SCALE = height;
        SVG.attr("viewBox", "0 0 " + width + " " + height);

        CHART.selectAll("circle")
            .each(function(d, i) {
                var self = d3.select(this);
                circlePositionUpdatedCallback(d.nodeId, d.absoluteX, d.absoluteY);
            })
    }
    this.getNodeCoordinateZoneRelativeToRootNode = function(nodeId) {
        const rootNode = NODES[ROOT_INDEX];
        const node = getNode(nodeId);
        const cxDiff = node.cx - rootNode.cx;
        const cyDiff = -(node.cy - rootNode.cy);
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
    };
    this.setNodeMouseOverCallback = function(callback) {
        NODE_MOUSE_OVER_CALLBACK = callback;
    }
    this.setNodeMouseOutCallback = function(callback) {
        NODE_MOUSE_OUT_CALLBACK = callback;
    }
    this.setMapMouseOverCallback = function(callback){
        MAP_MOUSE_OVER_CALLBACK = callback;
    }
    this.setMapMouseOutCallback = function(callback) {
        MAP_MOUSE_OUT_CALLBACK = callback;
    }
    this.setNodeClickedCallback = function(callback) {
        USER_NODE_CLICKED_CALLBACK = callback;
    }
    this.setNodeHighlight = function(nodeId, isHighlighted) {
        var node = getNode(nodeId);
        if (node) {
            node.isStrokeHighlighted = isHighlighted;
        } else {
            console.log("This node does not exists: " + nodeId);
        }
        redraw(COLOR_TRANSITION_DURATION, CHART, DEFAULT_NODE_COLOR, SIMILARITY_THRESHOLD, ZOOM_SCALE, MAP_TRANSLATION_X, MAP_TRANSLATION_Y, nodeVisibilityChangedMiddleware);
    }
    this.getNodePosition = function(nodeId) {
        var node = getNode(nodeId);
        if (node) {
            return {
                x: node.absoluteX,
                y: node.absoluteY
            }
        } else {
            console.log("This node does not exist: " + nodeId);
            return {
                x: 0,
                y: 0
            };
        }
    }
    this.changeNodeColors = function(colorName) {
        DEFAULT_NODE_COLOR = colorName;
        redraw(COLOR_TRANSITION_DURATION, CHART, DEFAULT_NODE_COLOR, SIMILARITY_THRESHOLD, ZOOM_SCALE, MAP_TRANSLATION_X, MAP_TRANSLATION_Y, nodeVisibilityChangedMiddleware);
    }
    this.changeBackgroundColor = function(colorName) {
        SVG.selectAll("rect")
            .transition().duration(COLOR_TRANSITION_DURATION)
            .attr("fill", colorName);
    }
    this.setVisibilitySimilarityThreshold = function(similarityThreshold) {
        SIMILARITY_THRESHOLD = similarityThreshold;
        redraw(COLOR_TRANSITION_DURATION, CHART, DEFAULT_NODE_COLOR, SIMILARITY_THRESHOLD, ZOOM_SCALE, MAP_TRANSLATION_X, MAP_TRANSLATION_Y, nodeVisibilityChangedMiddleware);
    }
    this.setVisibilityChangedCallback = function(callback) {
        NODE_VISIBILITY_CHANGED_CALLBACK = callback;
    }
    this.setForcedVisibility =  function(nodeId, isVisible) {
        var node = getNode(nodeId);
        if (node) {
            node.forcedVisibility = isVisible;
            redraw(COLOR_TRANSITION_DURATION, CHART, DEFAULT_NODE_COLOR, SIMILARITY_THRESHOLD, ZOOM_SCALE, MAP_TRANSLATION_X, MAP_TRANSLATION_Y, nodeVisibilityChangedMiddleware);
        } else {
            console.log("Unable to find node with ID " + nodeId);
        }
    }
    this.setSimilarityNodeVisibility = function(nodeId,isVisible) {
        var mathUtil = new MathUtilities();
        var node = getNode(nodeId);
        if(isVisible) {
            if(!node.similarityNodeSimulation) {
                const targetDocPos = {
                    x: node.cx,
                    y: node.cy
                }
                const sourceDocPos = {
                    x: NODES[ROOT_INDEX].cx,
                    y: NODES[ROOT_INDEX].cy,
                }

                //const slopeOfConnectionLine = mathUtil.slopeOfLineBetweenTwoPoints(sourceDocPos.x, sourceDocPos.y, targetDocPos.x, targetDocPos.y);

                const jointPoses = getPositionOfSimilarityNodeSimulation(nodeId);
                const firstJointPos = jointPoses.firstJointPos;
                const secondJointPos = jointPoses.secondJointPos;

                const sourceDocPosCartesian = mathUtil.convertCoordinatesToCartesianCoordinateSystem(sourceDocPos.x, sourceDocPos.y);
                const targetDocPosCartesian = mathUtil.convertCoordinatesToCartesianCoordinateSystem(targetDocPos.x, targetDocPos.y);
                const degreeOfConnectionLine = mathUtil.getDegreeOfGivenVector(sourceDocPosCartesian.x, sourceDocPosCartesian.y, targetDocPosCartesian.x, targetDocPosCartesian.y);

                var similarityNodeDegree = similarityNodesDegreeScale(node.similarityPercentage);

                const similarityNodeLineLength = MATCHED_DOC_RADIUS * 2;

                const similarityValues = {
                    textValue: node.data.similarities.text,
                    citationValue: node.data.similarities.citation,
                    imageValue: node.data.similarities.image,
                    formulaValue: node.data.similarities.formula
                }

                var simulation = new SimilarityNodesSimulation(SUB_CHART, firstJointPos, secondJointPos, degreeOfConnectionLine, similarityNodeDegree, similarityNodeLineLength, MATCHED_DOC_RADIUS/2, similarityValues, similarityTypeColorList);
                node.similarityNodeSimulation = simulation;
            }
        } else {
            if(node.similarityNodeSimulation) {
                node.similarityNodeSimulation.destroy();
                node.similarityNodeSimulation = null;
            }
        }
    }
}