function CitationComparison(FEATURE_ID, sourceDocumentData, targetDocumentData, documentComparisonData) {
    this.sourceDocumentData = sourceDocumentData;
    this.targetDocumentData = targetDocumentData;
    this.documentComparisonData = documentComparisonData;
    this.FEATURE_ID = FEATURE_ID;
    this.selectedAlgorithms = [];

    const CITATION_CHECKBOXES = document.getElementsByClassName("citation-algorithm-selection");
    const POSSIBLE_ALGORITHMS = ['cc','gct','lccs','lccsdist'];
    const CONTAINER_ID = "Citation-Content-Container";

    //allows the user to filter results based on different algorithms
    this.initializeCitationAlgorithmSelection = () => {
        for(let i = 0 ; i< CITATION_CHECKBOXES.length; i++){
            let currentBox = CITATION_CHECKBOXES[i];
            currentBox.addEventListener('change', () => {this.handleCitationSelectionChange()}, false);

            //add all the initially (on page load) checked algorithms to the selectedAlgorithms array
            if(currentBox.checked)
                this.selectedAlgorithms.push(POSSIBLE_ALGORITHMS[i]);
        }
    };

    this.initializeCitationAlgorithmSelection();

    this.visualizeCitationSimilarity = () => {
        const COMPARISON_DATA = this.getCitationComparisonData();
        const CIRCLE_PADDING = 20;
        const SVG_WIDTH = 960;
        const SVG_HEIGHT = 960;

        if (COMPARISON_DATA) {
            let boundingBox = d3
                    .pack()
                    .size([SVG_WIDTH, SVG_HEIGHT])
                    .padding(CIRCLE_PADDING),
                //d[2] is the maximum length of two citation matches strings, thus the size of a bubble depends on the length of its longest string
                root = d3
                    .hierarchy({children: COMPARISON_DATA})
                    .sum(function (d) {
                        return d.children ? 0 : d[2]
                    });

            let nodeData = boundingBox(root).children;

            if (nodeData) {

                let zoom = d3.zoom()
                    .on("zoom", function () {
                        g.attr("transform", d3.event.transform);
                    });

                let zoomedIn = false,
                    zoomedSemiCircle = "";

                let resetZoomParams = () => {
                    zoomedIn = false;
                    zoomedSemiCircle = "";
                };

                //create SVG inside the feature container
                const svg = d3
                    .select(`#${CONTAINER_ID}`)
                    .append("svg")
                        .attr("width", SVG_WIDTH)
                        .attr("height", SVG_HEIGHT)
                        .attr("id", "citation_svg")
                        .attr("class", "bubble");

                //this mask enables clicking on top of the svg to reset zoom
                const SVG_CLICK_MASK = svg
                    .append('rect')
                        .attr("width", SVG_WIDTH)
                        .attr("height", SVG_HEIGHT)
                        .attr("fill","white")
                        .style("opacity", 0)
                        .on("click", () => {
                            if(zoomedIn){
                                d3.select("#" + zoomedSemiCircle).transition().duration(500).call(zoom.transform, d3.zoomIdentity);
                                resetZoomParams();
                            }
                        })
                    .append("svg:title").text(() => {return "clicking on canvas resets the zoom level"});

                let g = svg
                    .append("g")
                    .call(zoom)
                    .on("wheel.zoom", null);

                //the y coordinate of the group for the upper semicircles is vertically shifted upwards to create the gap between the semicircles seen in the visualization
                const upperSemiCircleGroup = g
                    .append("g")
                        .attr('transform', `translate(0,${-CIRCLE_PADDING + 5})`);
                const lowerSemiCircleGroup = g.
                    append("g");

                //function that enables zooming/resetting on semicircle click
                let handleSemiCircleClick = (semiCircleId, x, y) => {
                    let semiCircle = d3.select("#" + semiCircleId);
                    if(!zoomedIn){
                        zoomedIn = true;
                        zoomedSemiCircle = semiCircleId;
                        semiCircle.call(zoom.translateTo, x , y).call(zoom.scaleTo, 2);
                    }
                    else{
                        resetZoomParams();
                        semiCircle.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
                    }
                };

                nodeData.forEach(function (data, index) {
                    let gUpper = upperSemiCircleGroup
                        .append("g")
                            .attr("id", () => {
                                return "upperG_" + index
                            })
                            .on('click', function() {
                                handleSemiCircleClick("upperG_" + index, data.x, data.y)
                            });

                    let gLower = lowerSemiCircleGroup
                        .append("g")
                            .attr("id", () => {
                                return "lowerG_" + index
                            })
                            .on('click', () => {
                               handleSemiCircleClick("lowerG_" + index, data.x, data.y)
                    });

                    //this is where the actual lower circle half of a node is drawn using a path
                    let lowerSemiCircle = gLower
                        .append('path')
                            .attr('d', d3.arc()({
                                innerRadius: 0,
                                outerRadius: data.r,
                                startAngle: Math.PI / 2,
                                endAngle: 3 / 2 * Math.PI
                            }))
                            .attr('transform', `translate(${data.x},${data.y})`)
                            .attr('fill', '#ffffff')
                            .attr('stroke', 'black')
                            .attr("id", () => {
                                return "lowerCircle_" + index
                            })
                            .on("mouseover", function () {
                                d3.select(this).attr("stroke", "red");
                            })
                            .on("mouseout", function () {
                                d3.select(this).attr("stroke", "black");
                            });

                    //upper half of the circle drawn
                    let upperSemiCircle = gUpper
                        .append('path')
                            .attr('d', d3.arc()({
                                innerRadius: 0,
                                outerRadius: data.r,
                                startAngle: 1 / 2 * Math.PI,
                                endAngle: -1 / 2 * Math.PI
                            }))
                            .attr('transform', `translate(${data.x},${data.y})`)
                            .attr('fill', '#e5e5e5')
                            .attr('stroke', 'black')
                            .attr("id", () => {
                                return "upperCircle_" + index
                            })
                            .on("mouseover", function () {
                                d3.select(this).attr("stroke", "red");
                            })
                            .on("mouseout", function () {
                                d3.select(this).attr("stroke", "black");
                            });

                    /*
                    The text is a div element (rectangle) which is scaled to fit into the semi-circle.
                    Text elements can not be appended to a path, but this allows to fill the div's innerHTML with our data
                    For more background on the math, check:
                    http://www.stumblingrobot.com/2015/10/06/find-the-largest-rectangle-that-can-be-inscribed-in-a-semicircle/
                    */
                    let upperText = gUpper
                        .append("foreignObject")
                            .attr("width", () => {
                                return data.r * Math.sqrt(2)
                            })
                            .attr("height", () => {
                                return data.r * (Math.sqrt(2) / 2)
                            })
                            .attr('transform', `translate(${data.x - (data.r / Math.sqrt(2))},${data.y - (data.r / Math.sqrt(2))})`)
                            .html(() => {
                                return data.data[0]
                            })
                            .style("font-size", () => {
                                //an approach to scale the font-size based on the string length to always fit the content into its parent container
                                //this works well for short and medium size strings, but the font scale becomes too small for long strings
                                return Math.sqrt(data.data[0].length) * data.r / (data.data[0].length) + "px";
                            })
                            .on("mouseover", function () {
                                d3.select("#upperCircle_" + index).attr("stroke", "red");
                            })
                            .on("mouseout", function () {
                                d3.select("#upperCircle_" + index).attr("stroke", "black");
                            });

                    let lowerText = gLower
                        .append("foreignObject")
                            .attr("width", () => {
                                return data.r * Math.sqrt(2)
                            })
                            .attr("height", () => {
                                return data.r * (Math.sqrt(2) / 2)
                            })
                            .attr('transform', `translate(${data.x - (data.r / Math.sqrt(2))},${data.y})`)
                            .html(() => {
                                return data.data[1]
                            })
                            .style("font-size", () => {
                                return Math.sqrt(data.data[1].length) * data.r / (data.data[1].length) + "px";
                            })
                            .on("mouseover", function () {
                                d3.select("#lowerCircle_" + index).attr("stroke", "red");
                            })
                            .on("mouseout", function () {
                                d3.select("#lowerCircle_" + index).attr("stroke", "black");
                            });

                });

            }
        }

    };

    //updates the visualization
    this.update = (sourceDocumentData, recommendationDocumentData, documentComparisonData) => {
        d3.select("#citation_svg").remove();
        this.sourceDocumentData = sourceDocumentData;
        this.targetDocumentData = recommendationDocumentData;
        this.documentComparisonData = documentComparisonData;

        this.visualizeCitationSimilarity();
    };

    //handler for the algorithm checkboxes
    this.handleCitationSelectionChange = (event) => {
        let selectedAlgorithms = [];

        for(let i = 0 ; i < CITATION_CHECKBOXES.length ; i++){
            if(CITATION_CHECKBOXES[i].checked)
                selectedAlgorithms.push(POSSIBLE_ALGORITHMS[i]);
        }

        this.selectedAlgorithms = selectedAlgorithms;
        d3.select("#citation_svg").remove();

        this.visualizeCitationSimilarity();
    };


    this.getCitationComparisonData = () => {
        let detectionResults = [];
        let returnValue = [];

        if (this.documentComparisonData) {
            //for each algorithm, get the citation matches (this will likely add duplicate entries)
            for (let i = 0; i < this.selectedAlgorithms.length; i++) {
                const ALGORITHM_DATA = this.documentComparisonData[this.selectedAlgorithms[i]];
                if (ALGORITHM_DATA && ALGORITHM_DATA.length > 0) {
                    const MATCHES = ALGORITHM_DATA[0].matches;
                    for (let k = 0; k < MATCHES.length; k++) {
                        const POSITION_IN_DOCUMENTS = MATCHES[k].position;
                        detectionResults.push(`${POSITION_IN_DOCUMENTS[0]}:${POSITION_IN_DOCUMENTS[1]}=${POSITION_IN_DOCUMENTS[2]}:${POSITION_IN_DOCUMENTS[3]}`);
                    }
                }
            }
        } else {
            utilityLib.informUser("alert-danger", "Comparison data retrieval has failed.");
            return null;
        }

        //filter out duplicates
        detectionResults = new Set(detectionResults);

        detectionResults.forEach((detectionEntry) => {
            //split into source and recommendation information
            let documentIntervals = detectionEntry.split("=");
            //retrieve source match start and end
            let [srcDocumentStartIndex, srcDocumentEndIndex] = documentIntervals[0].split(":").map(x => +x);
            //retrieve recommendation match start and end
            let [recommendationDocumentStartIndex, recommendationDocumentEndIndex] = documentIntervals[1].split(":").map(x => +x);
            const comparisonData = this.getDocumentDataFromPositions(srcDocumentStartIndex, srcDocumentEndIndex, recommendationDocumentStartIndex, recommendationDocumentEndIndex);
            if (!comparisonData) return null;
            returnValue.push(comparisonData);
        });

        return returnValue;
    };

    this.getDocumentDataFromPositions = (srcDocumentMatchStart, srcDocumentMatchEnd, recommendationDocumentMatchStart, recommendationDocumentMatchEnd) => {
        if (!this.sourceDocumentData || !this.targetDocumentData) {
            return null;
        }

        let srcSentenceStartIndex, srcSentenceEndIndex, recommendationSentenceStartIndex, recommendationSentenceEndIndex;
        //these documents consist of both normal text, as  well as html and xml tags
        const SOURCE_DOCUMENT_STRING_REPRESENTATION = this.sourceDocumentData.contentBody;
        const RECOMMENDATION_DOCUMENT_STRING_REPRESENTATION = this.targetDocumentData.contentBody;

        let sourceMatch = SOURCE_DOCUMENT_STRING_REPRESENTATION.slice(srcDocumentMatchStart, srcDocumentMatchEnd);
        let recommendationMatch = RECOMMENDATION_DOCUMENT_STRING_REPRESENTATION.slice(recommendationDocumentMatchStart, recommendationDocumentMatchEnd);

        //tries to find the index of the beginning of a sentence
        let findSentenceBeginning = (stringRepresentation, startIndex) => {
            for (let k = startIndex; k > 0; k--) {
                if (stringRepresentation[k - 1] === "." || stringRepresentation[k - 1] === "!" || stringRepresentation[k - 1] === "?") {
                    if (stringRepresentation[k].match(/\s/)) {
                        //special case of i.e. ; still missing hundreds of other special cases
                        if (!(stringRepresentation[k - 2] === "e") && !(stringRepresentation[k - 3] === ".")) {
                            return k;
                        }
                    }
                }
                //check if opening <p> tag is reached
                else if (stringRepresentation[k - 1] === ">") {
                    if (stringRepresentation[k - 2] === "p") {
                        return k;
                    }
                }
            }
        };

        //tries to find the index of the end of a sentence
        let findSentenceEnd = (stringRepresentation, startIndex) => {
            for (let k = --startIndex; k < stringRepresentation.length; k++) {
                if (stringRepresentation[k + 1] === "." || stringRepresentation[k + 1] === "!" || stringRepresentation[k + 1] === "?") {
                    if (stringRepresentation[k + 2].match(/\s/)) {
                        return ++k;
                    }
                }
                //closing html tag
                else if((stringRepresentation[k + 1] === "<") && (stringRepresentation[k + 2].match(/\\$/))){
                    return k;
                }
            }
        };

        srcSentenceStartIndex = findSentenceBeginning(SOURCE_DOCUMENT_STRING_REPRESENTATION, srcDocumentMatchStart);
        recommendationSentenceStartIndex = findSentenceBeginning(RECOMMENDATION_DOCUMENT_STRING_REPRESENTATION, recommendationDocumentMatchStart);
        srcSentenceEndIndex = findSentenceEnd(SOURCE_DOCUMENT_STRING_REPRESENTATION, srcDocumentMatchEnd);
        recommendationSentenceEndIndex = findSentenceEnd(RECOMMENDATION_DOCUMENT_STRING_REPRESENTATION, recommendationDocumentMatchEnd);

        //this is where we retrieve the entire sentence
        let srcSentence = SOURCE_DOCUMENT_STRING_REPRESENTATION.substring(srcSentenceStartIndex, srcSentenceEndIndex + 1);
        let targetSentence = RECOMMENDATION_DOCUMENT_STRING_REPRESENTATION.substring(recommendationSentenceStartIndex, recommendationSentenceEndIndex + 1);

        //here we get the iodizes of the citation match within our sentence
        const SRC_SENTENCE_CITATION_START = srcSentence.indexOf(sourceMatch);
        const SRC_SENTENCE_CITATION_END = srcSentence.indexOf(sourceMatch) + sourceMatch.length;
        const RECOMMENDATION_SENTENCE_CITATION_START = targetSentence.indexOf(recommendationMatch);
        const RECOMMENDATION_SENTENCE_CITATION_END = targetSentence.indexOf(recommendationMatch) + recommendationMatch.length;

        //this function creates a span around or citation match which is then used for highlighting
        let replaceStringAtIndex = (startIndex, endIndex, myString) => {
            //replace gets rid of all unwanted html and xml tags within our filtered data
            let preCitationContent = myString.substring(0, startIndex).replace(/(<([^>]+)>)/ig, '');
            let postCitationContent = myString.substring(endIndex).replace(/(<([^>]+)>)/ig, '');

            let citationContent = `<span class="citationTarget">${myString.slice(startIndex, endIndex).replace(/(<([^>]+)>)/ig, '')}</span>`;
            return preCitationContent + citationContent + postCitationContent;
        };

        srcSentence = replaceStringAtIndex(SRC_SENTENCE_CITATION_START, SRC_SENTENCE_CITATION_END, srcSentence);
        targetSentence = replaceStringAtIndex(RECOMMENDATION_SENTENCE_CITATION_START, RECOMMENDATION_SENTENCE_CITATION_END, targetSentence);

        //the third parameter is used for the d3 visualization; the bigger this value, the bigger the size of a circle
        return [srcSentence, targetSentence, Math.max(srcSentence.length, targetSentence.length)];
    }
}