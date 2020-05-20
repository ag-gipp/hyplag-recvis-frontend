const projectTitle = GLOBAL_FRONT_END_CONFIG.PROJECT_TITLE;
const projectBrand = GLOBAL_FRONT_END_CONFIG.PROJECT_BRAND;

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("project-title").innerHTML = projectTitle;
    document.getElementById("project-brand").innerHTML = projectBrand;

    let sourceDocumentData = null;
    let targetDocumentData = null;
    let documentComparisonData = null;
    //temporary solution to deal with callbacks being asynchronus
    let callbackCounter = 3;

    const FEATURE_NAME_CONTAINER_ID_MAPPING = {
        Citations: "Citation-Container",
        Math: "Math-Container",
        Text: "Text-Container",
        Figures: "Figures-Container"
    };


    const backendUrl = BACKEND_URL;
    let citationComparison = null;
    let textComparison = null;
    let formulaComparison = null;
    let figureComparison = null;

    var recvizLocalStorage = new RecvizLocalStorage();
    const INFO_BOX_ID = "#body-page-infobox";
    var utilityLib = new UtilitiesLibrary(INFO_BOX_ID);
    var backendApi = new BackendApi(backendUrl);

    const isTokenExists = recvizLocalStorage.isAuthTokenExists();
    if (isTokenExists) {
        const authToken = recvizLocalStorage.getAuthToken();
        const queryParams = utilityLib.getAllUrlParams();

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

            backendApi.getCollectedDocsList(authToken, function (err, result) {
                if (!err) {
                    initializeNavigation(result);
                } else {
                    console.log("Could not fetch document data");
                }
            });

            getComparisonData(backendApi, authToken, sourcedoc, targetdoc);


            /*
            This function adds EventListeners to the navigation items, as well as choosing which feature to display by default
             */
            function initializeNavigation(documents) {
                const anchors = document.getElementsByClassName("nav-link");
                const featureContainers = document.getElementsByClassName("tab-content");

                for (let i = 0; i < anchors.length; i++) {
                    anchors[i].addEventListener('click', (event) => toggleDisplayedFeature(event.target.innerText));
                }

                //display the feature at position 0 initially
                featureContainers[0].style.display = "flex";

                const dropDownMenu = document.getElementById("detailed-view-document-selection-menu");
                documents.collectedDocs.forEach(selectedDocument => {
                        var anchor = document.createElement('a');
                        anchor.appendChild(document.createTextNode(selectedDocument.title));
                        anchor.onclick = (event) => {
                            callbackCounter = 3;
                            console.log("YO");
                            var item = documents.collectedDocs.find((docObject) => docObject.title === event.target.innerText);
                            console.log(item);
                            getComparisonData(backendApi, authToken, sourcedoc, item.documentId);
                        };
                        dropDownMenu.appendChild(anchor);
                    }
                );
            }

            function toggleDisplayedFeature(featureName) {
                const featureContainers = document.getElementsByClassName("tab-content");
                var k;

                // hide all elements with class="tab-content"
                for (k = 0; k < featureContainers.length; k++) {
                    featureContainers[k].style.display = "none";
                }

                // Show the contents of the tab which has triggered the click event
                document.getElementById(FEATURE_NAME_CONTAINER_ID_MAPPING[featureName]).style.display = "flex";
            }


            function getComparisonData(backendApi, authToken, sourcedoc, targetdoc) {

                const errorHandler = (error) => {
                    if (error === "token expired") {
                        recvizLocalStorage.clearToken();
                        window.location.replace("/login.html");
                    } else {
                        utilityLib.informUser("alert-danger", error);
                    }
                };

                backendApi.detailedViewCompare(authToken, sourcedoc, targetdoc, function (err, comparisonData) {
                    if (!err) {
                        documentComparisonData = comparisonData;
                        console.log("COMPARISON DATA:");
                        console.log(documentComparisonData);
                        callbackResolved();
                    } else {
                        errorHandler(err);
                    }
                });

                backendApi.fetchDocumentFullData(authToken, sourcedoc, function (err, fullDocData) {
                    if (!err) {
                        sourceDocumentData = fullDocData;
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
            }

        } else {
            utilityLib.informUser("alert-danger", "Invalid query parameters. Please enter a valid URL.");
        }
    } else {
        utilityLib.informUser("alert-danger", "Authorization needed. Please login.");
        window.location.replace("/login.html");
    }

    //temporary solution to deal with callbacks being asynchronus
    function callbackResolved() {
        if (--callbackCounter == 0) {
            if (citationComparison && formulaComparison && textComparison && figureComparison) {
                citationComparison.update(sourceDocumentData, targetDocumentData, documentComparisonData);
                formulaComparison.update();
                textComparison.update(sourceDocumentData, targetDocumentData);
                figureComparison.update();
            } else {
                citationComparison = new CitationComparison(FEATURE_NAME_CONTAINER_ID_MAPPING["Citations"], sourceDocumentData, targetDocumentData, documentComparisonData);
                citationComparison.visualizeCitationSimilarity();
                formulaComparison = new FormulaComparison(FEATURE_NAME_CONTAINER_ID_MAPPING["Math"]);
                formulaComparison.visualizeFormulaSimilarity();
                textComparison = new TextComparison(FEATURE_NAME_CONTAINER_ID_MAPPING["Text"], sourceDocumentData, targetDocumentData);
                textComparison.visualizeTextSimilarity();
                figureComparison = new FigureComparison(FEATURE_NAME_CONTAINER_ID_MAPPING["Figures"]);
                figureComparison.visualizeImageSimilarity();
            }

        }
    }

});

/* Project Notes
    - Shadow effect on baseoverlays create performance issues when all nodes are in sight and there are about 15 nodes yet this effect makes it much more visually appealing.
*/


