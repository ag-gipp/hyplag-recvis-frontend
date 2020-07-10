const projectTitle = GLOBAL_FRONT_END_CONFIG.PROJECT_TITLE;
const projectBrand = GLOBAL_FRONT_END_CONFIG.PROJECT_BRAND;

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("project-title").innerHTML = projectTitle;
    document.getElementById("project-brand").innerHTML = projectBrand;

    let sourceDocumentData = null;
    let recommendationDocumentData = null;
    let documentComparisonData = null;
    //used to wait for asynchronous requests being complete
    let callbackCounter = 4;

    const FEATURE_NAME_CONTAINER_ID_MAPPING = {
        "Citations": "Citation-Container",
        "Mathematical expressions": "Math-Container",
        "Keywords": "Text-Container",
        "Figures": "Figures-Container",
        "Overview": "Overview-Container"
    };


    const backendUrl = BACKEND_URL;
    let citationComparison = null;
    let textComparison = null;
    let formulaComparison = null;
    let figureComparison = null;
    let overview = null;
    let collectedDocuments = null;

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

            //retrieve the list of collected documents
            backendApi.getCollectedDocsList(authToken, function (err, result) {
                if (!err) {
                    collectedDocuments = result.collectedDocs;
                    callbackResolved();
                } else {
                    utilityLib.informUser("alert-danger", err);
                }
            });

            getComparisonData(backendApi, authToken, sourcedoc, targetdoc);



            //this function adds EventListeners to the navigation items, as well as choosing which feature to display by default
            function initializeNavigation() {
                const NAVIGATION_TAB_ANCHORS = document.getElementsByClassName("nav-link");
                const FEATURE_CONTAINERS = document.getElementsByClassName("tab-content");
                const DOCUMENT_SELECTION_DROPDOWN = document.getElementById("detailed-view-document-selection-menu");

                for (let i = 0; i < NAVIGATION_TAB_ANCHORS.length; i++) {
                    NAVIGATION_TAB_ANCHORS[i].addEventListener('click', (event) => toggleDisplayedFeature(event.target.innerText));
                }

                //only display content of the first feature container
                for(let i = 1 ; i < FEATURE_CONTAINERS.length; i++){
                    FEATURE_CONTAINERS[i].style.display = "none";
                }

                collectedDocuments.forEach((selectedDocument,index) => {
                        let anchor = document.createElement('a');
                        anchor.classList.add('dropdown-item');
                        if(selectedDocument.documentId === recommendationDocumentData.documentId){
                            anchor.classList.add('active');
                        }
                        anchor.setAttribute('id', `dropdown_element_${index}`);
                        anchor.appendChild(document.createTextNode(selectedDocument.title));
                        anchor.onclick = (event) => {
                            //new asynchronous requests to the backend are being made, thus the callbackCounter needs to be "reset"
                            //3 instead of 4, because the collected documents are not being requested anew
                            callbackCounter = 3;
                            let selectedDocument = collectedDocuments[+event.target.id.slice(-1)];
                            [...DOCUMENT_SELECTION_DROPDOWN.children].filter((anchor) => anchor.classList.contains("active"))[0].classList.remove("active");
                            [...DOCUMENT_SELECTION_DROPDOWN.children][index].classList.add("active");
                            getComparisonData(backendApi, authToken, sourcedoc, selectedDocument.documentId);
                        };
                        DOCUMENT_SELECTION_DROPDOWN.appendChild(anchor);
                    }
                );
            }

            //function that handles the navigation between different views
            function toggleDisplayedFeature(featureName) {
                const FEATURE_CONTAINERS = document.getElementsByClassName("tab-content");

                // hide all elements with class="tab-content"
                for (let k = 0; k < FEATURE_CONTAINERS.length; k++) {
                    FEATURE_CONTAINERS[k].style.display = "none";
                }

                // Show the contents of the tab which has triggered the click event
                document.getElementById(FEATURE_NAME_CONTAINER_ID_MAPPING[featureName]).style.display = "flex";
            }

            //this functions requests data about the source document, recommendation document and their comparison data from the backend
            function getComparisonData(backendApi, authToken, sourcedoc, recommendedDoc) {

                const errorHandler = (error) => {
                    if (error === "token expired") {
                        recvizLocalStorage.clearToken();
                        window.location.replace("/login.html");
                    } else {
                        utilityLib.informUser("alert-danger", error);
                    }
                };

                backendApi.detailedViewCompare(authToken, sourcedoc, recommendedDoc, function (err, comparisonData) {
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
                        callbackResolved();
                    } else {
                        errorHandler(err);
                    }
                });

                backendApi.fetchDocumentFullData(authToken, recommendedDoc, function (err, fullDocData) {
                    if (!err) {
                        recommendationDocumentData = fullDocData;
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

    //this function either instantiates or updates the feature views once all necessary data has been retrieved
    function callbackResolved() {
        if (--callbackCounter === 0) {
            if (citationComparison && formulaComparison && textComparison && figureComparison && overview) {
                citationComparison.update(sourceDocumentData, recommendationDocumentData, documentComparisonData);
                formulaComparison.update(sourceDocumentData, recommendationDocumentData, documentComparisonData);
                textComparison.update(sourceDocumentData, recommendationDocumentData, documentComparisonData);
                figureComparison.update(sourceDocumentData, recommendationDocumentData, documentComparisonData);
                overview.update(documentComparisonData, recommendationDocumentData);
            } else {
                initializeNavigation();

                citationComparison = new CitationComparison(FEATURE_NAME_CONTAINER_ID_MAPPING["Citations"], sourceDocumentData, recommendationDocumentData, documentComparisonData);
                citationComparison.visualizeCitationSimilarity();
                formulaComparison = new FormulaComparison(FEATURE_NAME_CONTAINER_ID_MAPPING["Mathematical expressions"], sourceDocumentData, recommendationDocumentData, documentComparisonData);
                formulaComparison.visualizeFormulaSimilarity();
                textComparison = new TextComparison(FEATURE_NAME_CONTAINER_ID_MAPPING["Keywords"], sourceDocumentData, recommendationDocumentData, documentComparisonData);
                textComparison.visualizeTextSimilarity();
                figureComparison = new FigureComparison(FEATURE_NAME_CONTAINER_ID_MAPPING["Figures"], sourceDocumentData, recommendationDocumentData, documentComparisonData);
                figureComparison.visualizeImageSimilarity();
                overview = new RecommendationOverview(FEATURE_NAME_CONTAINER_ID_MAPPING["Overview"], documentComparisonData,recommendationDocumentData);
                overview.visualizeOverview();
            }

        }
    }

});

/* Project Notes
    - Shadow effect on baseoverlays create performance issues when all nodes are in sight and there are about 15 nodes yet this effect makes it much more visually appealing.
*/


