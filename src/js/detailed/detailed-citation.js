function CitationComparison(FEATURE_ID, sourceDocumentData, targetDocumentData, documentComparisonData) {
    this.sourceDocumentData = sourceDocumentData;
    this.targetDocumentData = targetDocumentData;
    this.documentComparisonData = documentComparisonData;
    this.FEATURE_ID = FEATURE_ID;


    this.visualizeCitationSimilarity = () => {
        const CIRCLE_PADDING = 20;
        const SVG_WIDTH = document.getElementById(this.FEATURE_ID).clientWidth;
        const SVG_HEIGHT = document.getElementById(this.FEATURE_ID).clientHeight;
        const COMPARISON_DATA = this.getCitationComparisonData();

        if(COMPARISON_DATA && SVG_WIDTH && SVG_HEIGHT){
            console.log(COMPARISON_DATA);
            let boundingBox = d3.pack().size([SVG_WIDTH, SVG_HEIGHT]).padding(CIRCLE_PADDING),
                root = d3.hierarchy({children: COMPARISON_DATA}).sum(function (d) {
                    return d.children ? 0 : d[2]
                });

            let nodeData = boundingBox(root).children;



            //create SVG inside the feature container
            const svg = d3
                .select(`#${this.FEATURE_ID}`)
                .append("svg")
                .attr("width", SVG_WIDTH)
                .attr("height", SVG_HEIGHT).attr("id", "citation_svg")
                .attr("class", "bubble")
                .call(d3.zoom().on("zoom", function () {
                    svg.attr("transform", d3.event.transform)
                }));

            const upperCircleGroup = svg.append("g").attr('transform', `translate(0,${-CIRCLE_PADDING + 5})`);
            const lowerCircleGroup = svg.append("g");
            //TODO: error handling when there is no nodeData
            nodeData.forEach(function (data, index) {
                console.log(index);
                let gUpper = upperCircleGroup.append("g");
                let gLower = lowerCircleGroup.append("g");


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
                    })
                    .on("click", () => console.log(d3.select(this)));

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
                    .on("click", () => console.log(d3.select(this)));


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
                    .text(() => {
                        return data.data[0]
                    })
                    .style("font-size", () => {
                        return Math.sqrt(data.data[0].length) * data.r / (data.data[0].length) + "px";
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
                    .text(() => {
                        return data.data[1]
                    })
                    .style("font-size", () => {
                        return Math.sqrt(data.data[1].length) * data.r / (data.data[1].length) + "px";
                    });
            });

            console.log(svg.selectAll(".node"));
            svg.attr("transform", "scale(1.5,1)");
        }

    };

    this.update = (updatedSourceDocumentData, updatedTargetDocumentData, updatedDocumentComparisonData) => {
        d3.select("#citation_svg").remove();
        this.sourceDocumentData = updatedSourceDocumentData;
        this.targetDocumentData = updatedTargetDocumentData;
        this.documentComparisonData = updatedDocumentComparisonData;

        this.visualizeCitationSimilarity();
        //might need to trigger page reload?
    };


    this.getCitationComparisonData = () =>  {
        const CITATION_PATTERN_ALGORITHMS = ['cc', 'gct', 'lccs', 'lccsdist'];
        const VALUE_PATTERN_ALGORITHM = 'bc';
        let detectionResults = [];
        let uniqueDetectionResults;
        let returnValue = [];

        if (this.documentComparisonData) {
            for (let i = 0; i < CITATION_PATTERN_ALGORITHMS.length; i++) {
                const ALGORITHM_DATA = this.documentComparisonData[CITATION_PATTERN_ALGORITHMS[i]];
                if (ALGORITHM_DATA && ALGORITHM_DATA.length > 0) {
                    const MATCHES = ALGORITHM_DATA[0].matches;
                    for (let k = 0; k < MATCHES.length; k++) {
                        const POSITION_IN_DOCUMENTS = MATCHES[k].position;
                        detectionResults.push(`${POSITION_IN_DOCUMENTS[0]}:${POSITION_IN_DOCUMENTS[1]}=${POSITION_IN_DOCUMENTS[2]}:${POSITION_IN_DOCUMENTS[3]}`);
                    }
                }
            }
            //TODO: add bibliographic coupling.. kinda weird as it can have different sized arrays
            const ALGORITHM_DATA = this.documentComparisonData[VALUE_PATTERN_ALGORITHM];
            if(ALGORITHM_DATA && ALGORITHM_DATA.length > 0){

            }
        } else {
            utilityLib.informUser("alert-danger", "Comparison data retrieval has failed.");
            return null;
        }

        uniqueDetectionResults = new Set(detectionResults);

        uniqueDetectionResults.forEach((detectionEntry) => {
            let documentIntervals = detectionEntry.split("=");
            let srcDocumentInterval = documentIntervals[0].split(":").map(x => +x);
            let targetDocumentInterval = documentIntervals[1].split(":").map(x => +x);
            const comparisonData = this.getDocumentDataFromPositions(srcDocumentInterval[0], srcDocumentInterval[1], targetDocumentInterval[0], targetDocumentInterval[1]);
            if(!comparisonData) return null;
            returnValue.push(comparisonData);
        });

        return returnValue;
    };

    this.getDocumentDataFromPositions = (srcDocumentBeginning, srcDocumentEnd, targetDocumentBeginning, targetDocumentEnd) => {
        if(!this.sourceDocumentData || !this.targetDocumentData){
            //utilityLib.informUser("alert-danger", "Data can not be retrieved from files.");
            return null;
        }

        let srcLowerBound, srcUpperBound, targetLowerBound, targetUpperBound;
        let sourceDocumentStringRepresentation = this.sourceDocumentData.contentBody;
        let targetDocumentStringRepresentation = this.targetDocumentData.contentBody;

        //TODO: put into function
        for(let k = srcDocumentBeginning ; k > 0 ; k--){
            if(sourceDocumentStringRepresentation[k].match("[!.?]") &&
                !sourceDocumentStringRepresentation[k-1].match("[b]") &&
                !sourceDocumentStringRepresentation[k-2].match("[i]") &&
                !sourceDocumentStringRepresentation[k-3].match("[b]")){
                srcLowerBound = ++k;
                break;
            }
        }

        for(let k = srcDocumentEnd ; k < sourceDocumentStringRepresentation.length ; k++){
            if(sourceDocumentStringRepresentation[k].match("[!.?]") &&
                !sourceDocumentStringRepresentation[k-1].match("[b]") &&
                !sourceDocumentStringRepresentation[k-2].match("[i]") &&
                !sourceDocumentStringRepresentation[k-3].match("[b]")){
                srcUpperBound = k;
                break;
            }
        }

        for(var k = targetDocumentBeginning ; k > 0 ; k--){
            if(targetDocumentStringRepresentation[k].match("[!.?]") &&
                !targetDocumentStringRepresentation[k-1].match("[b]") &&
                !targetDocumentStringRepresentation[k-2].match("[i]") &&
                !targetDocumentStringRepresentation[k-3].match("[b]")){
                targetLowerBound = ++k;
                break;
            }
        }

        for(var k = targetDocumentEnd ; k < targetDocumentStringRepresentation.length ; k++){
            if(targetDocumentStringRepresentation[k].match("[!.?]") &&
                !targetDocumentStringRepresentation[k-1].match("[b]") &&
                !targetDocumentStringRepresentation[k-2].match("[i]") &&
                !targetDocumentStringRepresentation[k-3].match("[b]")){
                targetUpperBound = k;
                break;
            }
        }

        //TODO: improve finding a sentence
        const srcSentence = sourceDocumentStringRepresentation.substring(srcLowerBound, srcUpperBound + 1);
        const targetSentence = targetDocumentStringRepresentation.substring(targetLowerBound, targetUpperBound + 1);

        return [srcSentence, targetSentence, Math.max(srcSentence.length, targetSentence.length)];
    }
}