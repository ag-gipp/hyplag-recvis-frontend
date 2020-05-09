const projectTitle = GLOBAL_FRONT_END_CONFIG.PROJECT_TITLE;
const projectBrand = GLOBAL_FRONT_END_CONFIG.PROJECT_BRAND;

var sourceDocumentData = null;
var targetDocumentData = null;
var documentComparisonData = null;
//temporary solution to deal with callbacks being asynchronus
var callbackCounter = 3;
const FEATURE_NAME_CONTAINER_ID_MAPPING = {
    Citations: "Citation-Container",
    Math: "Math-Container",
    Figures: "Text-Container",
    Text: "Figures-Container"
};

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("project-title").innerHTML = projectTitle;
    document.getElementById("project-brand").innerHTML = projectBrand;

    const backendUrl = BACKEND_URL;

    var recvizLocalStorage = new RecvizLocalStorage();

    const INFO_BOX_ID = "#body-page-infobox";
    var utilityLib = new UtilitiesLibrary(INFO_BOX_ID);
    var backendApi = new BackendApi(backendUrl);

    const isTokenExists = recvizLocalStorage.isAuthTokenExists();
    if (isTokenExists) {
        const authToken = recvizLocalStorage.getAuthToken();
        const queryParams = utilityLib.getAllUrlParams();
        const errorHandler = (error) => {
            if (error === "token expired") {
                recvizLocalStorage.clearToken();
                window.location.replace("/login.html");
            } else {
                utilityLib.informUser("alert-danger", error);
            }
        };

        if (queryParams && queryParams.folderid && queryParams.fileid && queryParams.sourcedoc && queryParams.targetdoc) {
            const folderId = queryParams.folderid;
            const fileId = queryParams.fileid;
            const sourcedoc = queryParams.sourcedoc;
            const targetdoc = queryParams.targetdoc;

            const foldername = queryParams.foldername;
            const filename = queryParams.filename;

            if (foldername && filename) {
                const folderUrl = "/folder.html?folderId=" + folderId;
                document.getElementById("breadcrumb-folder-name").innerHTML = '<a href="' + folderUrl + '">' + foldername + "</a>";
                const overviewUrl = "/overview.html?folderId=" + folderId + "&fileId=" + fileId + "&folderName=" + foldername + "&fileName=" + filename;
                document.getElementById("breadcrumb-file-name").innerHTML = '<a href="' + overviewUrl + '">' + filename + "</a>";
            }

            //The "backendApi" calls are for demonstrating the data fetching from backend that you could possibly use for your visualization.
            //backendApi provides callback based API, if you are not familiar with callbacks please do a reading on that. These calls are not going to work sequentially thus do not get surprised about it.
            //If callback based API becomes a pain, I may switch to promise based API if that would help.

            backendApi.detailedViewCompare(authToken, sourcedoc, targetdoc, function (err, comparisonData) {
                if (!err) {
                    documentComparisonData = comparisonData;
                    callbackResolved();
                } else {
                    errorHandler(err);
                }
            });

            backendApi.fetchDocumentFullData(authToken, sourcedoc, function (err, fullDocData) {
                if (!err) {
                    sourceDocumentData = fullDocData;
                    console.log("SOURCE DOC FULL DATA:");
                    console.log(sourceDocumentData);
                    callbackResolved();
                } else {
                    errorHandler(err);
                }
            });

            backendApi.fetchDocumentFullData(authToken, targetdoc, function (err, fullDocData) {
                if (!err) {
                    targetDocumentData = fullDocData
                    callbackResolved();
                } else {
                    errorHandler(err);
                }
            });

            backendApi.fetchDocumentMetadata(authToken, sourcedoc, function (err, metadata) {
                if (!err) {
                    console.log("SOURCE DOC METADATA:");
                    console.log(metadata);
                } else {
                    errorHandler(err);
                }
            });

            backendApi.fetchDocumentMetadata(authToken, targetdoc, function (err, metadata) {
                if (!err) {
                    console.log("TARGET DOC METADATA:");
                    console.log(metadata);
                } else {
                    errorHandler(err);
                }
            });


            var navigationDiv = document.getElementById("detailed-view-navbar"); //This will serve necessary controls for enabling/disabling individiual similarity components such as text, citation and image. For example, I should be able to just see text plagiarism detection or text + citation or text + citation + image or nothing at all. This DIV is giving me ability to select what I want to see.
            var baseVisualizationDiv = document.getElementById("detailed-view-base-vis"); //This is where your visualization go.
            initializeNavigation();

        } else {
            utilityLib.informUser("alert-danger", "Invalid query parameters. Please enter a valid URL.");
        }
    } else {
        utilityLib.informUser("alert-danger", "Authorization needed. Please login.");
        window.location.replace("/login.html");
    }
});

/* Project Notes
    - Shadow effect on baseoverlays create performance issues when all nodes are in sight and there are about 15 nodes yet this effect makes it much more visually appealing.
*/

//temporary solution to deal with callbacks being asynchronus
function callbackResolved(){
    if(--callbackCounter == 0){
        visualizeCitationComparison();
        visualizeFormulaComparison();
        visualizeTextComparison();
        visualizeImagesComparison();
    }
}


/*
This function adds EventListeners to the navigation items, as well as choosing which feature to display by default
 */
function initializeNavigation() {
    const anchors = document.getElementsByClassName("nav-link");
    const featureContainers = document.getElementsByClassName("tab-content");
    var i;

    for (i = 0; i < anchors.length; i++) {
        anchors[i].addEventListener('click', (event) => toggleDisplayedFeature(event.target.innerText));
    }

    //display the feature at position 0 initially
    for (i = 1; i < featureContainers.length; i++) {
        featureContainers[i].style.display = "none";
    }
}

function toggleDisplayedFeature(featureName) {
    const featureContainers = document.getElementsByClassName("tab-content");
    var k;

    // hide all elements with class="tab-content"
    for (k = 0; k < featureContainers.length; k++) {
        featureContainers[k].style.display = "none";
    }

    // Show the contents of the tab which has triggered the click event
    document.getElementById(FEATURE_NAME_CONTAINER_ID_MAPPING[featureName]).style.display = "block";
}


function visualizeCitationComparison() {
    //TODO: calculate width and height based on available size later on
    const SVG_WIDTH = 960;
    const SVG_HEIGHT = 500;
    const FEATURE_ID = FEATURE_NAME_CONTAINER_ID_MAPPING["Citations"];
    const COMPARISON_DATA = getCitationComparisonData();

    //create SVG inside the feature container
    d3.select(`#${FEATURE_ID}`).append("svg").attr("width", SVG_WIDTH).attr("height", SVG_HEIGHT);

    //access newly created svg
    const svg = d3.select('svg');

    //work on svg
    const g = svg
        .append('g')
        .attr('transform', `translate(${SVG_WIDTH / 2},${SVG_HEIGHT / 2})`);

    const circle = g
        .append('circle')
        .attr('r', 200)
        .attr('fill', 'yellow')
        .attr('stroke', 'black');

    const eyesG = g
        .append('g')
        .attr('transform', `translate(0,-80)`);

    const leftEye = eyesG
        .append('circle')
        .attr('r', 30)
        .attr('cx', -100);

    const rightEye = eyesG
        .append('circle')
        .attr('r', 30)
        .attr('cx', 100);

    const leftEyebrow = eyesG
        .append('rect')
        .attr('width', 60)
        .attr('height', 15)
        .attr("x", -100 - 50 / 2)
        .attr("y", -60);

    const rightEyebrow = eyesG
        .append('rect')
        .attr('width', 60)
        .attr('height', 15)
        .attr("x", 75)
        .attr("y", -60)
        .transition().duration(2000)
        .attr('y', -80)
        .transition().duration(2000)
        .attr("y", -60);

    const mouth = g
        .append('path')
        .attr('d', d3.arc()({
            innerRadius: 0,
            outerRadius: 150,
            startAngle: Math.PI / 2,
            endAngle: 3 / 2 * Math.PI
        }));
}

function getCitationComparisonData() {
    const CITATION_PATTERN_ALGORITHMS = ['cc', 'gct', 'lccs', 'lccsdist'];
    const VALUE_PATTERN_ALGORITHM = 'bc';
    var detectionResults = [];
    var uniqueDetectionResults;
    var returnValue = [];
    var i, k;

    if (documentComparisonData) {
        for (i = 0; i < CITATION_PATTERN_ALGORITHMS.length; i++) {
            const ALGORITHM_DATA = documentComparisonData[CITATION_PATTERN_ALGORITHMS[i]];
            if (ALGORITHM_DATA && ALGORITHM_DATA.length > 0) {
                const MATCHES = ALGORITHM_DATA[0].matches;
                for (k = 0; k < MATCHES.length; k++) {
                    const POSITION_IN_DOCUMENTS = MATCHES[k].position;
                    detectionResults.push(`${POSITION_IN_DOCUMENTS[0]}:${POSITION_IN_DOCUMENTS[1]}=${POSITION_IN_DOCUMENTS[2]}:${POSITION_IN_DOCUMENTS[3]}`);
                }
            }
        }
        //TODO: add bibliographic coupling.. kinda weird as it can have different sized arrays
        const ALGORITHM_DATA = documentComparisonData[VALUE_PATTERN_ALGORITHM];
        if(ALGORITHM_DATA && ALGORITHM_DATA.length > 0){

        }
    } else {
        utilityLib.informUser("alert-danger", "Comparison data retrieval has failed.");
        return null;
    }

    uniqueDetectionResults = new Set(detectionResults);

    uniqueDetectionResults.forEach((detectionEntry) => {
        var documentIntervals = detectionEntry.split("=");
        var srcDocumentInterval = documentIntervals[0].split(":").map(x => +x);
        var targetDocumentInterval = documentIntervals[1].split(":").map(x => +x);
        const comparisonData = getDocumentDataFromPositions(srcDocumentInterval[0], srcDocumentInterval[1], targetDocumentInterval[0], targetDocumentInterval[1]);
        if(!comparisonData) return null;
        returnValue.push(comparisonData);
    });

    return returnValue;
}

function getDocumentDataFromPositions(srcDocumentBeginning, srcDocumentEnd, targetDocumentBeginning, targetDocumentEnd) {
    var citationStrings;
    console.log(srcDocumentBeginning + " " + srcDocumentEnd + "  " + targetDocumentBeginning + " " + targetDocumentEnd);
    var sourceDocumentStringRepresentation = sourceDocumentData.contentBody;
    var targetDocumentStringRepresentation = targetDocumentData.contentBody;

    console.log(sourceDocumentStringRepresentation.substring(srcDocumentBeginning, srcDocumentEnd));
    console.log(targetDocumentStringRepresentation.substring(targetDocumentBeginning, targetDocumentEnd));
    if(!sourceDocumentData || !targetDocumentData){
        //utilityLib.informUser("alert-danger", "Data can not be retrieved from files.");
        return null;
    }

}

function visualizeFormulaComparison() {
    console.log("Formulas are being visualized");
}

function visualizeTextComparison() {
    console.log("Text is being visualized")
}

function visualizeImagesComparison() {
    console.log("Images are being visualized");
}
