function CitationComparison(FEATURE_ID, sourceDocumentData, targetDocumentData, documentComparisonData) {
    this.sourceDocumentData = sourceDocumentData;
    this.targetDocumentData = targetDocumentData;
    this.documentComparisonData = documentComparisonData;
    this.FEATURE_ID = FEATURE_ID;
    this.selectedAlgorithms = [];

    const CITATION_CHECKBOXES = document.getElementsByClassName("citation-algorithm-selection");
    const POSSIBLE_ALGORITHMS = ['cc','gct','lccs','lccsdist'];


    this.initializeCitationSelection = () => {
        for(let i = 0 ; i< CITATION_CHECKBOXES.length; i++){
            let currentBox = CITATION_CHECKBOXES[i];
            currentBox.addEventListener('change', (event) => {this.handleCitationSelectionChange()}, false);

            if(currentBox.checked)
                this.selectedAlgorithms.push(POSSIBLE_ALGORITHMS[i]);
        }
    };

    this.initializeCitationSelection();


    this.visualizeCitationSimilarity = () => {
        const CONTAINER_ID = "Citation-Content-Container";
        const CIRCLE_PADDING = 20;
        const SVG_WIDTH = 960;
        const SVG_HEIGHT = 960;
        const COMPARISON_DATA = this.getCitationComparisonData();

        if (COMPARISON_DATA) {
            let boundingBox = d3.pack().size([SVG_WIDTH, SVG_HEIGHT]).padding(CIRCLE_PADDING),
                root = d3.hierarchy({children: COMPARISON_DATA}).sum(function (d) {
                    return d.children ? 0 : d[2]
                });

            let nodeData = boundingBox(root).children;

            if (nodeData) {

                let zoom = d3.zoom().on("zoom", function () {
                    g.attr("transform", d3.event.transform);
                });

                let zoomedIn = false;

                //create SVG inside the feature container
                const svg = d3
                    .select(`#${CONTAINER_ID}`)
                    .append("svg")
                    .attr("width", SVG_WIDTH)
                    .attr("height", SVG_HEIGHT)
                    .attr("id", "citation_svg")
                    .attr("class", "bubble");

                let g = svg.append("g").call(zoom)
                    .on("wheel.zoom", null);

                const upperCircleGroup = g.append("g").attr('transform', `translate(0,${-CIRCLE_PADDING + 5})`);
                const lowerCircleGroup = g.append("g");



                nodeData.forEach(function (data, index) {
                    let gUpper = upperCircleGroup
                        .append("g")
                            .attr("id", () => {
                                return "upperG_" + index
                            })
                            .on('click', () => {
                                if(!zoomedIn){
                                    zoomedIn = true;
                                    gUpper.call(zoom.translateTo, data.x , data.y).call(zoom.scaleTo, 2);
                                }
                                else{
                                    zoomedIn = false;
                                    gUpper.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
                                }
                            });

                    let gLower = lowerCircleGroup
                        .append("g")
                            .attr("id", () => {
                                return "lowerG_" + index
                            })
                            .on('click', () => {
                                if(!zoomedIn){
                                    zoomedIn = true;
                                    gLower.call(zoom.translateTo, data.x , data.y).call(zoom.scaleTo, 2);
                                }
                                else{
                                    zoomedIn = false;
                                    gLower.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
                                }
                    });

                    let lowerCircle = gLower.append('path')
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

                    let upperCircle = gUpper.append('path')
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
                        })
                        .on("click", () => {

                        });


                    //http://www.stumblingrobot.com/2015/10/06/find-the-largest-rectangle-that-can-be-inscribed-in-a-semicircle/
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

                    let calculateAbsoluteSpanPosition = function getPos(el) {
                        // yay readability
                        let lx = 0, ly = 0;
                        do{
                            lx += el.offsetTop;
                            ly += el.offsetTop;
                            el = el.parentElement;

                        }while(el.parentElement);

                        return [lx, ly];
                    }

                    /*
                    let lowerSpan = lowerText[Object.keys(lowerText)[0]][0][0].children[0];
                    let upperSpan = upperText[Object.keys(upperText)[0]][0][0].children[0];

                    let lowerY = lowerSpan.getBoundingClientRect().top;
                    let lowerX = lowerSpan.getBoundingClientRect().left;
                    let upperY = upperSpan.getBoundingClientRect().top;
                    let upperX = upperSpan.getBoundingClientRect().left;
                    */
                });

            }
        }

    };

    this.update = (updatedSourceDocumentData, updatedTargetDocumentData, updatedDocumentComparisonData) => {
        d3.select("#citation_svg").remove();
        console.log(updatedSourceDocumentData, updatedTargetDocumentData, updatedDocumentComparisonData);
        this.sourceDocumentData = updatedSourceDocumentData;
        this.targetDocumentData = updatedTargetDocumentData;
        this.documentComparisonData = updatedDocumentComparisonData;

        this.visualizeCitationSimilarity();
    };

    this.handleCitationSelectionChange = (event) => {
        let selectedAlgorithms = [];
        for(let i = 0 ; i < CITATION_CHECKBOXES.length ; i++){
            if(CITATION_CHECKBOXES[i].checked)
                selectedAlgorithms.push(POSSIBLE_ALGORITHMS[i]);
        }

        this.selectedAlgorithms = selectedAlgorithms;
        console.log(this.selectedAlgorithms);
        d3.select("#citation_svg").remove();

        this.visualizeCitationSimilarity();
    };


    this.getCitationComparisonData = () => {
        let detectionResults = [];
        let uniqueDetectionResults;
        let returnValue = [];

        if (this.documentComparisonData) {
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
            //TODO: add bibliographic coupling.. kinda weird as it can have different sized array
        } else {
            utilityLib.informUser("alert-danger", "Comparison data retrieval has failed.");
            return null;
        }

        uniqueDetectionResults = new Set(detectionResults);
        console.log(uniqueDetectionResults);

        uniqueDetectionResults.forEach((detectionEntry) => {
            let documentIntervals = detectionEntry.split("=");
            let srcDocumentInterval = documentIntervals[0].split(":").map(x => +x);
            let targetDocumentInterval = documentIntervals[1].split(":").map(x => +x);
            const comparisonData = this.getDocumentDataFromPositions(srcDocumentInterval[0], srcDocumentInterval[1], targetDocumentInterval[0], targetDocumentInterval[1]);
            if (!comparisonData) return null;
            returnValue.push(comparisonData);
        });

        return returnValue;
    };

    this.getDocumentDataFromPositions = (srcDocumentBeginning, srcDocumentEnd, targetDocumentBeginning, targetDocumentEnd) => {
        if (!this.sourceDocumentData || !this.targetDocumentData) {
            //utilityLib.informUser("alert-danger", "Data can not be retrieved from files.");
            return null;
        }


        let srcLowerBound, srcUpperBound, targetLowerBound, targetUpperBound;
        let sourceDocumentStringRepresentation = this.sourceDocumentData.contentBody;
        let targetDocumentStringRepresentation = this.targetDocumentData.contentBody;

        let srcEntry = sourceDocumentStringRepresentation.slice(srcDocumentBeginning, srcDocumentEnd);
        let targetEntry = targetDocumentStringRepresentation.slice(targetDocumentBeginning, targetDocumentEnd);

        //TODO: put into function
        for (let k = srcDocumentBeginning; k > 0; k--) {
            if (sourceDocumentStringRepresentation[k - 1] === "." || sourceDocumentStringRepresentation[k - 1] === "!" || sourceDocumentStringRepresentation[k - 1] === "?") {
                if (sourceDocumentStringRepresentation[k].match(/\s/)) {
                    //special case of i.e. ; still missing Dr. so it is not really solved
                    if (!(sourceDocumentStringRepresentation[k - 2] === "e") && !(sourceDocumentStringRepresentation[k - 3] === ".")) {
                        srcLowerBound = k;
                        break;
                    }
                }
            } else if (sourceDocumentStringRepresentation[k - 1] === ">") {
                if (sourceDocumentStringRepresentation[k - 2] === "p") {
                    srcLowerBound = k;
                    break;
                }
            }
        }

        for (let k = --srcDocumentEnd; k < sourceDocumentStringRepresentation.length; k++) {
            if (sourceDocumentStringRepresentation[k + 1] === "." || sourceDocumentStringRepresentation[k + 1] === "!" || sourceDocumentStringRepresentation[k + 1] === "?") {
                if (sourceDocumentStringRepresentation[k + 2].match(/\s/)) {
                    srcUpperBound = ++k;
                    break;
                }
            }
        }

        for (let k = targetDocumentBeginning; k > 0; k--) {
            if (targetDocumentStringRepresentation[k - 1] === "." || targetDocumentStringRepresentation[k - 1] === "!" || targetDocumentStringRepresentation[k - 1] === "?") {
                if (targetDocumentStringRepresentation[k].match(/\s/)) {
                    //special case of i.e. ; still missing similar things like Dr. so it is not really solved
                    if (!(targetDocumentStringRepresentation[k - 2] === "e") && !(targetDocumentStringRepresentation[k - 3] === ".")) {
                        targetLowerBound = k;
                        break;
                    }
                }
            } else if (targetDocumentStringRepresentation[k - 1] === ">") {
                if (targetDocumentStringRepresentation[k - 2] === "p") {
                    targetLowerBound = k;
                    break;
                }
            }
        }

        for (let k = --targetDocumentEnd; k < targetDocumentStringRepresentation.length; k++) {
            if (targetDocumentStringRepresentation[k + 1] === "." || targetDocumentStringRepresentation[k + 1] === "!" || targetDocumentStringRepresentation === "?") {
                if (targetDocumentStringRepresentation[k + 2].match(/\s/)) {
                    targetUpperBound = ++k;
                    break;
                }
            }
        }

        let srcSentence = sourceDocumentStringRepresentation.substring(srcLowerBound, srcUpperBound + 1);
        let targetSentence = targetDocumentStringRepresentation.substring(targetLowerBound, targetUpperBound + 1);

        console.log(targetDocumentStringRepresentation.substring(targetDocumentBeginning, targetDocumentEnd))

        const srcCitationStart = srcSentence.indexOf(srcEntry);
        const srcCitationEnd = srcSentence.indexOf(srcEntry) + srcEntry.length;
        const targetCitationStart = targetSentence.indexOf(targetEntry);
        const targetCitationEnd = targetSentence.indexOf(targetEntry) + targetEntry.length;

        let replaceStringAtIndex = (startIndex, endIndex, myString) => {
            let prior = myString.substring(0, startIndex).replace(/(<([^>]+)>)/ig, '');
            let following = myString.substring(endIndex).replace(/(<([^>]+)>)/ig, '');

            let subject = `<span class="citationTarget">${myString.slice(startIndex, endIndex).replace(/(<([^>]+)>)/ig, '')}</span>`;
            return prior + subject + following;
        };

        srcSentence = replaceStringAtIndex(srcCitationStart, srcCitationEnd, srcSentence);
        targetSentence = replaceStringAtIndex(targetCitationStart, targetCitationEnd, targetSentence);


        return [srcSentence, targetSentence, Math.max(srcSentence.length, targetSentence.length)];
    }
}