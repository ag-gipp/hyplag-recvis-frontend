function OverviewUI() {
    var SOURCE_DOCUMENT = null;

    var MATCHED_DOCUMENTS = [];

    const SIMILARITY_DECIMAL_PRECISION = 1;
    
    const NODE_COLOR = "#A9A9A9";
    const NODE_RADIUS = 15;
    const NODE_DISTANCE_MULTIPLIER = 1.8;
    const NODE_REPULSION_STRENGTH = -1700;

    const COMMON_OVERLAY_WIDTH_SCALE = 8;

    const NANO_OVERLAY_HEIGHT_SCALE= 3;
    const SUMMARY_OVERLAY_HEIGHT_SCALE = 8;
    const DETAILED_OVERLAY_HEIGHT_SCALE = 10;

    const OVERLAY_FONT_SIZE_ADJUSTMENT_VALUE = 50;

    const LOCAL_STORAGE_NAME = "savedUserData";

    var SAVED_USER_DATA = {
        weightSetList: [],
        collectedDocumentIds: [],
        collectedDocumentOrder: [],
        researchDisciplineWeightSetList: []
    }

    const AVAILABLE_NODE_TYPES = {
        SOURCE_DOC: "source-doc",
        MATCHED_DOC: "matched-doc"
    }

    const NORMAL_SUMMARY_ZOOM_THRESHOLD = 2.5;

    var OVERALL_SIMILARITY_PERCENTAGES = [];

    //const HYPLAG_DEFAULT_BACKGROUND_COLOR = "#e0e2e4";
    const HYPLAG_DEFAULT_BACKGROUND_COLOR = "white";

    var VISIBILITY_THRESHOLD = 0;

    var TOTAL_DOCUMENT_NUMBER = 0;

    var documentMap = null;
    var rightPanel = null;
    var leftPanel = null;
    var overlayerPanel = null;
    var mapLegend = null;
    var MATCHED_DOCUMENTS = null;
    var hyplagRecvizModel = null;

    var INITIAL_SIMILARITY_WEIGHTS = GLOBAL_FRONT_END_CONFIG.INITIAL_SIMILARITY_WEIGHTS;

    var AUTH_TOKEN = null;
    var BACKEND_API_MODULE = null;

    const ROOT_NODE_DEFAULT_DOCUMENT_ID = 0;

    var FILE_ID = null;
    var FOLDER_ID = null;
    var FOLDER_NAME = null;
    var FILE_NAME = null;
    var SOURCE_DOC_ID = null;

    const COLLECTED_DOC_MAX_CHAR_NUMBER = 50;
    var SELECTED_COLLECTED_DOC = null;

    const SIMILARITY_TYPE_COLOR_LIST = ["rgb(153,213,202)", "rgb(255,223,113)", "rgb(255,163,71)", "rgb(247,80,47)"]; //text, citation, image, formula

    function truncateString(str, n, useWordBoundary ){
        if (str.length <= n) { return str; }
        var subString = str.substr(0, n-1);
        return (useWordBoundary 
           ? subString.substr(0, subString.lastIndexOf(' ')) 
           : subString) + "&hellip;";
    };

    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    function saveData() {
        localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(SAVED_USER_DATA));
    }

    function getSavedData() {
        var savedData = localStorage.getItem(LOCAL_STORAGE_NAME);
        if (isJson(savedData)) {
            return JSON.parse(savedData);
        } else {
            return null;
        }
    }

    function calculateOverlayPosition(coordinateZoneNumber, cx, cy, nodeRadius, zoomScale, overlayWidth, overlayHeight) {
        var overlayPosX = 0;
        var overlayPosY = 0;

        const h = nodeRadius / Math.sqrt(2);
        if (coordinateZoneNumber == 1) {
            overlayPosX = cx + h * zoomScale;
            overlayPosY = cy - h * zoomScale;
        } else if (coordinateZoneNumber == 2) {
            overlayPosX = cx - overlayWidth - h * zoomScale;
            overlayPosY = cy - h * zoomScale;
        } else if (coordinateZoneNumber == 3) {
            overlayPosX = cx - overlayWidth - h * zoomScale;
            overlayPosY = cy + overlayHeight + h * zoomScale;
        } else if (coordinateZoneNumber == 4) {
            overlayPosX = cx + h * zoomScale;
            overlayPosY = cy + overlayHeight + h * zoomScale;
        } else {
            overlayPosX = cx;
            overlayPosY = cy;
        }
        return { "x": overlayPosX, "y": overlayPosY };
    }

    function calculateOverlaySize(nodeRadius, overlayType, zoomScale) {
        var overlayWidth = 0;
        var overlayHeight = 0;
        if (overlayType == OVERLAY_TYPES.NANO) {
            overlayWidth = nodeRadius * zoomScale * COMMON_OVERLAY_WIDTH_SCALE;
            overlayHeight = nodeRadius * zoomScale * NANO_OVERLAY_HEIGHT_SCALE;
        } else if (overlayType == OVERLAY_TYPES.SUMMARY) {
            overlayWidth = nodeRadius * zoomScale * COMMON_OVERLAY_WIDTH_SCALE;
            overlayHeight = nodeRadius * zoomScale * SUMMARY_OVERLAY_HEIGHT_SCALE;
        } else if (overlayType == OVERLAY_TYPES.DETAILED) {
            overlayWidth = nodeRadius * zoomScale * COMMON_OVERLAY_WIDTH_SCALE;
            overlayHeight = nodeRadius * zoomScale * DETAILED_OVERLAY_HEIGHT_SCALE;
        } else {
            console.log("Unknown overlay type: " + overlayType);
        }
        return {
            w: overlayWidth,
            h: overlayHeight
        }
    }

    function getFirstAuthor(authorList) {
        var firstAuthor = "";
        if (authorList.length > 0) {
            firstAuthor = authorList[0];
        }
        return firstAuthor;
    }

    const OVERLAY_TYPES = {
        "NANO": "NANO",
        "SUMMARY": "SUMMARY",
        "DETAILED": "DETAILED"
    }

    function getDocumentData(docId) {
        var documentFound = null;

        MATCHED_DOCUMENTS.forEach(function(matchedDoc){
            if(matchedDoc.documentId == docId) {
                documentFound = matchedDoc;
            }
        });
        
        if(documentFound) {
            return documentFound
        } else {
            return null;
        }
    }

    function updateOverlayPosition(overlayType, overlayId, nodeCx, nodeCy, zoomScale) {
        const overlaySize = calculateOverlaySize(NODE_RADIUS, overlayType, zoomScale);
        const overlayWidth = overlaySize.w;
        const overlayHeight = overlaySize.h;

        const coordinateSystemPositionRelativeToRoot = documentMap.getNodeCoordinateZoneRelativeToRootNode(overlayId);
        const overlayPos = calculateOverlayPosition(coordinateSystemPositionRelativeToRoot, nodeCx, nodeCy, NODE_RADIUS, zoomScale, overlayWidth, overlayHeight);
        overlayerPanel.setOverlayPosition(overlayId, overlayPos.x, overlayPos.y, overlayWidth, overlayHeight);
    }

    function setOverlayView(overlayType, overlayId, nodeCx, nodeCy, zoomScale) {
        if(overlayId == ROOT_NODE_DEFAULT_DOCUMENT_ID) {
            return;
        }
        updateOverlayPosition(overlayType, overlayId, nodeCx, nodeCy, zoomScale);
        var matchedDoc = getDocumentData(overlayId);

        if (matchedDoc.isAuthorMatched) {
            //console.log("Author matched: " + overlayId);
            //console.log(matchedDoc.authorMatches);
        }

        if (overlayType == OVERLAY_TYPES.NANO) {
            //const year = matchedDoc.year;
            //var firstAuthor = getFirstAuthor(matchedDoc.authors);
            const title = truncateString(matchedDoc.name, GLOBAL_FRONT_END_CONFIG.NANO_OVERLAY_TITLE_CHAR_LIMIT);
            const firstAuthor = getFirstAuthor(matchedDoc.authors);
            overlayerPanel.setNanoSummaryViewContent(overlayId, title, firstAuthor, matchedDoc.authorMatches);
        } else if (overlayType == OVERLAY_TYPES.SUMMARY) {
            const title = matchedDoc.name;
            const year = matchedDoc.year;
            const venue = matchedDoc.journal;
            overlayerPanel.setSummaryViewContent(overlayId, title, matchedDoc.authors, matchedDoc.authorMatches, year, venue);
        } else if (overlayType == OVERLAY_TYPES.DETAILED) {
            const title = matchedDoc.name;
            const year = matchedDoc.year;
            const venue = matchedDoc.journal;
            overlayerPanel.setDetailedViewContent(overlayId, title, matchedDoc.authors, matchedDoc.authorMatches, year, venue);
        } else {
            console.log("Unknown overlay type")
        }
    }
    var SELECTED_NODE_ID = null;

    function updateSummaryOverlayAccordingToZoomScale(zoomScale, overlayId, cx, cy) {
        if (zoomScale < NORMAL_SUMMARY_ZOOM_THRESHOLD) {
            setOverlayView(OVERLAY_TYPES.NANO, overlayId, cx, cy, zoomScale);
        } else {
            setOverlayView(OVERLAY_TYPES.SUMMARY, overlayId, cx, cy, zoomScale);
        }
    }

    function isColor(strColor) {
        var s = new Option().style;
        s.color = strColor;
        return s.color == strColor;
    }

    function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function initializeAdvancedOptions() {
        const textDomIdToAppend = "textRange-dropdown-box";
        const textAdvancedConfigId = textDomIdToAppend + "-advanced-panel";
        textAdvancedConfig = new AdvancedConfigWidget(textDomIdToAppend, textAdvancedConfigId);

        const textboxLabel = textAdvancedConfig.createRowLabel("Node Configuration");
        const textBoxSetNodeColorId = textAdvancedConfigId + "-setNodeColor";
        const textBoxSetNodeColorDesc = "Set node colors using basic colors such as red, blue, etc.";
        const textBoxSetNodeColorDefault = "black";
        const setNodeColorTextbox = textAdvancedConfig.createTextbox(textBoxSetNodeColorId, textBoxSetNodeColorDesc, textBoxSetNodeColorDefault, textBoxSetNodeColorValueChanged);

        textAdvancedConfig.displayConfigurationBundle([textboxLabel, setNodeColorTextbox]);

        const checkboxGroupLabel = textAdvancedConfig.createRowLabel("Some Checkboxes Here, by the way this is very long description just to see how it goes.");
        const exampleCheckboxId = textAdvancedConfigId + "-exampleCheckbox";
        const exampleCheckboxDesc = "This is an example checkbox that would do something.";
        const isExampleCheckboxCheckedByDefault = false;
        const exampleCheckbox = textAdvancedConfig.createCheckbox(exampleCheckboxId, exampleCheckboxDesc, isExampleCheckboxCheckedByDefault, exampleCheckboxValueChanged);

        const exampleCheckboxId2 = textAdvancedConfigId + "-exampleCheckbox2";
        const exampleCheckboxDesc2 = "This is another example checkbox that would do something else.";
        const exampleCheckbox2 = textAdvancedConfig.createCheckbox(exampleCheckboxId2, exampleCheckboxDesc2, !isExampleCheckboxCheckedByDefault, exampleCheckboxValueChanged);

        textAdvancedConfig.displayConfigurationBundle([checkboxGroupLabel, exampleCheckbox, exampleCheckbox2]);

        const radioLabel = textAdvancedConfig.createRowLabel("Map Background");
        const radioExampleButtonId = textAdvancedConfigId + "-radio-example-1";
        const exampleRadioDesc = "Default";
        const isRadioButtonCheckedByDefault = true;
        const radioButtonGroupName = "backgroundChangeButtons";
        const exampleRadio1 = textAdvancedConfig.createRadioButton(radioExampleButtonId, exampleRadioDesc, isRadioButtonCheckedByDefault, radioButtonGroupName, exampleRadiuoButtonsValueChanged);

        const radioExampleButtonId2 = textAdvancedConfigId + "-radio-example-2";
        const exampleRadioDesc2 = "New random value.";
        const exampleRadio2 = textAdvancedConfig.createRadioButton(radioExampleButtonId2, exampleRadioDesc2, !isRadioButtonCheckedByDefault, radioButtonGroupName, exampleRadiuoButtonsValueChanged);

        textAdvancedConfig.displayConfigurationBundle([radioLabel, exampleRadio1, exampleRadio2]);
    }

    function showSourceDocumentInformation(sourceDoc) {
        const title = sourceDoc.name;
        const authorsList = sourceDoc.authors;
        const venue = sourceDoc.journal;
        const year = sourceDoc.year;

        var titleElement = document.getElementById("source-document-title");
        var authorsElement = document.getElementById("source-document-authors");
        var venueElement = document.getElementById("source-document-venue");
        var yearElement = document.getElementById("source-document-year");

        titleElement.innerHTML = (title || "Title not found.");
        authorsElement.innerHTML = (authorsList.join(", ") || "Authors are not found.");
        venueElement.innerHTML = (venue || "Venue not found.");
        yearElement.innerHTML = (year || "Year not found.");
    }
    /* Helper Functions */
    function isExpandedNodeExists() {
        if(SELECTED_NODE_ID) {
            return true;
        } else {
            return false;
        }
    }
    function isNodeExpanded(overlayId) {
        if(overlayId == SELECTED_NODE_ID) {
            return true;
        } else {
            return false;
        }
    }
    function getExpandedNodeID() {
        return SELECTED_NODE_ID;
    }

    /* Handle Aggregated Events */
    function shrinkNode(overlayId) {
        SELECTED_NODE_ID = null;
        
        const zoomScale = documentMap.getZoomScale();
        const nodePos = documentMap.getNodePosition(overlayId);
        const isHighlighted = false;
        const isForcedVisibility = false;
        const isSimilarityNodesAreVisible = false;

        updateSummaryOverlayAccordingToZoomScale(zoomScale, overlayId, nodePos.x, nodePos.y);
        highlightNode(overlayId, isHighlighted);
        documentMap.setForcedVisibility(overlayId, isForcedVisibility);
        documentMap.setSimilarityNodeVisibility(overlayId, isSimilarityNodesAreVisible);
        rightPanel.setWeightSliderColorVisibility(isSimilarityNodesAreVisible);
    }

    function expandNode(overlayId) {
        SELECTED_NODE_ID = overlayId;

        const zoomScale = documentMap.getZoomScale();
        const nodePos = documentMap.getNodePosition(overlayId);
        const isHighlighted = true;
        const isForcedVisibility = true;
        const isSimilarityNodesAreVisible = true;

        setOverlayView(OVERLAY_TYPES.DETAILED, overlayId, nodePos.x, nodePos.y, zoomScale);
        highlightNode(overlayId, isHighlighted);
        documentMap.setForcedVisibility(overlayId, isForcedVisibility);
        documentMap.setSimilarityNodeVisibility(overlayId, isSimilarityNodesAreVisible);
        rightPanel.setWeightSliderColorVisibility(isSimilarityNodesAreVisible);
    }

    function highlightNode(nodeId, isHighlighted) {
        if(nodeId == ROOT_NODE_DEFAULT_DOCUMENT_ID) {
            return;
        }
        overlayerPanel.setOverlayMouseOverStatus(nodeId, isHighlighted);
        documentMap.setNodeHighlight(nodeId, isHighlighted);
        leftPanel.setCollectedDocumentHoverEffect(nodeId, isHighlighted);
        var nodeData = getDocumentData(nodeId);
        nodeData.isHighlighted = isHighlighted;
    }



    /* Advanced Config Panel Event Handlers */
        /* Text Advanced Config Panel */
        function textBoxSetNodeColorValueChanged(newValue) {
            if (isColor(newValue)) {
                documentMap.changeNodeColors(newValue);
            } else {
                console.log("This is invalid color: " + newValue);
            }
        }

        function exampleCheckboxValueChanged(newValue) {
            console.log("New example checkbox value: " + newValue);
        }

        function exampleRadiuoButtonsValueChanged(newValue) {
            if (newValue == "Default") {
                documentMap.changeBackgroundColor(HYPLAG_DEFAULT_BACKGROUND_COLOR);
            } else if (newValue == "New random value.") {
                documentMap.changeBackgroundColor(getRandomColor());
            } else {
                console.log("Error, unknown radio button value!")
            }
        }
        
    /* Overlay Event Handlers */
    function overlayClicked(overlayId) {
        if(isExpandedNodeExists()) {
            const expandedNodeId = getExpandedNodeID();
            if(overlayId != expandedNodeId) {
                shrinkNode(expandedNodeId);
                expandNode(overlayId);
            } else {
                shrinkNode(expandedNodeId);
            }
        } else {
            expandNode(overlayId);
        }
    }

    function overlayHoverEventHandler(overlayId, isHovered) {
        const nodeId = overlayId;
        if (SELECTED_NODE_ID != nodeId) {
            highlightNode(nodeId, isHovered);
        }
    }
    
    function documentStarStatusChanged(overlayId, isStarred) {
        const nodeId = overlayId;
        const nodeData = getDocumentData(nodeId);

        if (!isStarred) {
            const collectedDocID = parseInt(nodeId);

            BACKEND_API_MODULE.removeCollectedDoc(AUTH_TOKEN, collectedDocID, function(err, res){
                if(!err) {
                    leftPanel.removeCollectedDocument(overlayId);
                    nodeData.isCollected = false;
                } else {
                    alert("Unable to remove this document from collected document list: "+err);
                }
            })
        } else {
            const collectedDocID = parseInt(nodeId);
            const collectedDocTitle = nodeData.name;
            const authorsList = nodeData.authors;
            console.log(authorsList)

            BACKEND_API_MODULE.addCollectedDoc(AUTH_TOKEN, collectedDocID, collectedDocTitle, authorsList, function(err, res){
                if(!err) {
                    const truncatedName = truncateString(nodeData.name, COLLECTED_DOC_MAX_CHAR_NUMBER, false);
                    leftPanel.pushCollectedDocument(truncatedName, nodeId, authorsList);
                    leftPanel.setCollectedDocumentHoverEffect(nodeId, true);
                    nodeData.isCollected = true;
                } else {
                    alert("Unable to remove this document from collected document list: "+err);
                }
            })
        }
    }

    /* Right Panel Event Handlers */
    function weightSlidersChanged(textWeight, citationWeight, imageWeight, formulaWeight) {
        rightPanel.setCheckedOption("Custom");
        var similarityWeights = {
            text: textWeight,
            citation: citationWeight,
            image: imageWeight,
            formula: formulaWeight
        }
        OVERALL_SIMILARITY_PERCENTAGES = hyplagRecvizModel.calculateGlobalSimilarityValue(MATCHED_DOCUMENTS, similarityWeights, SIMILARITY_DECIMAL_PRECISION);
        documentMap.setOverallSimilarities(OVERALL_SIMILARITY_PERCENTAGES);
    }

    function weightsSavedButtonPressed(weightName, weightSet) {
        var foundObj = SAVED_USER_DATA.weightSetList.find(function(weightSetObj) {
            return weightSetObj.name == weightName;
        });
        if (!foundObj) {
            BACKEND_API_MODULE.addWeightset(AUTH_TOKEN, weightName, weightSet.text, weightSet.citation, weightSet.image, weightSet.formula, function(err, weightsetID){
                if(!err) {
                    rightPanel.pushNewSelection(weightName, weightsetID);
                    rightPanel.setCheckedOption(weightsetID);
                    rightPanel.setSliderWeights(
                        weightSet.text,
                        weightSet.citation,
                        weightSet.image,
                        weightSet.formula
                    );
                    SAVED_USER_DATA.weightSetList.push({
                        _id: weightsetID,
                        name: weightName,
                        text: weightSet.text,
                        citation: weightSet.citation,
                        image: weightSet.image,
                        formula: weightSet.formula
                    })
                } else {

                }
            })
        } else {
            alert("This name already exists.");
        }
    }

    function weightSetNameEditedButtonPressed(weightsetID, newWeightName) {
        var foundObj = SAVED_USER_DATA.weightSetList.find(function(weightSetObj) {
            return weightSetObj._id == weightsetID;
        });

        if (foundObj) {
            BACKEND_API_MODULE.editWeightsetName(AUTH_TOKEN, weightsetID, newWeightName, function(err, isSucceded){
                rightPanel.changeSelectionName(weightsetID, newWeightName);
                foundObj.name = newWeightName;
                console.log("Name is successfully changed");
            })
        } else {
            alert("Unable to find the weightset.");
        }
    }

    function weightSetDeleteButtonPressed(weightsetID) {
        var foundIndex = null;
        var foundObj = SAVED_USER_DATA.weightSetList.find(function(weightSetObj, index) {
            if (weightSetObj._id == weightsetID) foundIndex = index;
            return weightSetObj._id == weightsetID;
        });

        if (foundObj) {
            BACKEND_API_MODULE.deleteWeightset(AUTH_TOKEN, weightsetID, function(err, isSucceded){
                if(!err) {
                    rightPanel.deleteSelection(weightsetID);
                    SAVED_USER_DATA.weightSetList.splice(foundIndex, 1);
                } else {
                    alert("Unable to delete the weightset.");
                }
            })
        } else {
            alert("This weightset does not exist.");
        }
    }

    function weightSetSelected(weightsetID) {
        var foundObj = SAVED_USER_DATA.weightSetList.find(function(weightSetObj, index) {
            return weightSetObj._id == weightsetID;
        });

        if(!foundObj) {
            foundObj = SAVED_USER_DATA.researchDisciplineWeightSetList.find(function(weightSetObj, index) {
                return weightSetObj._id == weightsetID;
            });    
        }

        if (foundObj) {
            var similarityWeights = {
                text: foundObj.text,
                citation: foundObj.citation,
                image: foundObj.image,
                formula: foundObj.formula
            }
            OVERALL_SIMILARITY_PERCENTAGES = hyplagRecvizModel.calculateGlobalSimilarityValue(MATCHED_DOCUMENTS, similarityWeights, SIMILARITY_DECIMAL_PRECISION);
            documentMap.setOverallSimilarities(OVERALL_SIMILARITY_PERCENTAGES);

            rightPanel.setSliderWeights(
                similarityWeights.text,
                similarityWeights.citation,
                similarityWeights.image,
                similarityWeights.formula
            );
        } else {
            alert("Unable to get data of selected weight set.");
        }
    }

    function similarityThresholdSliderChanged(newValue) {
        documentMap.setVisibilitySimilarityThreshold(newValue);
    }

    /* Left Panel Event Handlers */
    function compareInDetailButtonPressed(documentId) {
        if(SELECTED_COLLECTED_DOC !== null) {
            window.location.href = "detailed.html?folderId="+FOLDER_ID+"&fileId="+FILE_ID+"&folderName="+FOLDER_NAME+"&fileName="+FILE_NAME+"&sourcedoc="+SOURCE_DOC_ID+"&targetdoc="+SELECTED_COLLECTED_DOC;
        } else {
            alert("Select a collected document that is present on the map to start comparing it with the source file.")
        }
    }

    function collectedDocumentOrderChanged() {
        const newOrder = leftPanel.getCollectedDocumentsOrder();
        var orderList = [];

        newOrder.forEach(function(documentID){
            orderList.push(parseInt(documentID));
        });

        BACKEND_API_MODULE.setCollectedDocOrder(AUTH_TOKEN, orderList, function(err, isSucceded){
            if(!err && isSucceded) {
                console.log("Synced collected documents order with server.");
            } else {
                alert("Unable to sync collected document orders with server!");
            }
        });
    }

    function collectedDocumentRemoveIconClicked(documentId) {
        var nodeData = getDocumentData(documentId);
        const collectedDocID = parseInt(documentId);

        BACKEND_API_MODULE.removeCollectedDoc(AUTH_TOKEN, collectedDocID, function(err, res){
            if(!err) {
                leftPanel.removeCollectedDocument(documentId);

                if(nodeData) {
                    nodeData.isCollected = false;
                    overlayerPanel.changeStarStatus(documentId, false);
    
                    if (documentId != SELECTED_NODE_ID) {
                        highlightNode(documentId, false);
                    }
                }
            } else {
                alert("Unable to remove this document from collected document list: "+err);
            }
        })
    }

    function collectedDocHoverStatusChanged(docId, isHoveredIn) {
        var isDocumentExistsOnMap = getDocumentData(docId) !== null;
        if(!isDocumentExistsOnMap) return;

        const nodeId = docId;
        if (SELECTED_NODE_ID != nodeId) {
            overlayerPanel.setOverlayMouseOverStatus(nodeId, isHoveredIn);
            highlightNode(nodeId, isHoveredIn)
        }
    }

    function collectedDocumentClicked(docId) {
        var isDocumentExistsOnMap = getDocumentData(docId) !== null;
        if(!isDocumentExistsOnMap) return;

        if(isExpandedNodeExists()) {
            const expandedNodeId = getExpandedNodeID();
            if(docId != expandedNodeId) {
                shrinkNode(expandedNodeId);
                expandNode(docId);
                SELECTED_COLLECTED_DOC = docId;
            } else {
                SELECTED_COLLECTED_DOC = null;
                shrinkNode(expandedNodeId);
            }
        } else {
            SELECTED_COLLECTED_DOC = docId;
            expandNode(docId);
        }
    }

    /* Document Map Event Handlers */
    function nodeClickedCallback(nodeId) {
        if(isExpandedNodeExists()) {
            const expandedNodeId = getExpandedNodeID();
            if(nodeId != expandedNodeId) {
                shrinkNode(expandedNodeId);
                expandNode(nodeId);
            } else {
                shrinkNode(expandedNodeId);
            }
        } else {
            expandNode(nodeId);
        }
    }

    function nodePositionUpdated(nodeId, cx, cy) {
        const overlayId = nodeId;
        const zoomScale = documentMap.getZoomScale();
        if (nodeId != 0) {
            if (nodeId != SELECTED_NODE_ID) {
                updateSummaryOverlayAccordingToZoomScale(zoomScale, overlayId, cx, cy);
            } else {
                updateOverlayPosition(OVERLAY_TYPES.DETAILED, overlayId, cx, cy, zoomScale);
            }
        }
    }

    function nodeMouseOver(nodeId) {
        if (SELECTED_NODE_ID != nodeId) {
            const isHighlighted = true;
            highlightNode(nodeId, isHighlighted);
        }
    }

    function nodeMouseOut(nodeId) {
        if (SELECTED_NODE_ID != nodeId) {
            const isHighlighted = false;
            highlightNode(nodeId, isHighlighted);
        }
    }

    function nodeVisibilityChanged(nodeId, isVisible) {
        overlayerPanel.setVisibility(nodeId, isVisible);
    }

    function mapMouseOver() {
        MATCHED_DOCUMENTS.forEach(function(matchedDoc){
            const nodeId = matchedDoc.documentId;
            const nodeData = getDocumentData(nodeId);
            if(nodeData.isHighlighted && (SELECTED_NODE_ID != nodeId)) {
                const isHighlighted = false;
                highlightNode(nodeId, isHighlighted);
            }
        })
    }

    /* Application Initialization */
    this.initialize = function(sourceDoc, matchedDocs, authToken, backendUrl, fileId, folderId, folderName, fileName) {
        const removeDocDocumentImageSource = "./image/overview/delete-button.png";

        FILE_ID = fileId;
        FOLDER_ID = folderId;
        FOLDER_NAME = folderName;
        FILE_NAME = fileName;

        SOURCE_DOC_ID = sourceDoc.hyplagIdForSourceDoc;

        SOURCE_DOCUMENT = sourceDoc;
        MATCHED_DOCUMENTS = matchedDocs;
        TOTAL_DOCUMENT_NUMBER = 1 + MATCHED_DOCUMENTS.length;
        AUTH_TOKEN = authToken;

        BACKEND_API_MODULE = new BackendApi(backendUrl);

        const canvasId = "hyplag-map";
        const overlayerDivId = "hyplag-map-overlay";
        
        const starImg = "./image/overview/star.png";
        const starGoldenImg = "./image/overview/star-golden.png";

        showSourceDocumentInformation(SOURCE_DOCUMENT);

        overlayerPanel = new OverlayerPanel(overlayerDivId, starImg, starGoldenImg, GLOBAL_FRONT_END_CONFIG.OVERVIEW_CSS_PATH);
        overlayerPanel.setOverlayClickedCallback(overlayClicked);
        overlayerPanel.setOverlayHoverEventHandlerCallback(overlayHoverEventHandler);
        overlayerPanel.setDocumentStarStatusChangedCallback(documentStarStatusChanged);

        overlayerPanel.setNanoOverlayFontRatio(OVERLAY_FONT_SIZE_ADJUSTMENT_VALUE/NANO_OVERLAY_HEIGHT_SCALE);
        overlayerPanel.setSummaryOverlayFontRatio(OVERLAY_FONT_SIZE_ADJUSTMENT_VALUE/SUMMARY_OVERLAY_HEIGHT_SCALE);
        overlayerPanel.setDetailedOverlayFontRatio(OVERLAY_FONT_SIZE_ADJUSTMENT_VALUE/DETAILED_OVERLAY_HEIGHT_SCALE);

        var overlayId = null;
        MATCHED_DOCUMENTS.forEach(function(matchedDoc) {
            overlayId = matchedDoc.documentId;
            overlayerPanel.createOverlay(overlayId);
            if (matchedDoc.isThereAuthorMatch) {
                var nodeData = getDocumentData(overlayId);
                nodeData.isAuthorMatched = true;
                overlayerPanel.setAuthorHighlights(overlayId, matchedDoc.authorMatches);
            }
        })

        leftPanel = new LeftPanel(removeDocDocumentImageSource);
        leftPanel.setCompareInDetailButtonClickedCallback(compareInDetailButtonPressed);
        leftPanel.setCollectedDocumentsOrderChangedCallback(collectedDocumentOrderChanged);
        leftPanel.setRemoveIconClickedCallback(collectedDocumentRemoveIconClicked);
        leftPanel.setCollectedDocumentHoverStatusChangedCallback(collectedDocHoverStatusChanged);
        leftPanel.setCollectedDocumentClickedCallback(collectedDocumentClicked);

        SIMILARITY_WEIGHTS = INITIAL_SIMILARITY_WEIGHTS;

        const mapSize = document.getElementById("hyplag-map").getBoundingClientRect();
        const MAP_X_SCALE = mapSize.width;
        const MAP_Y_SCALE = mapSize.height;
        const MAP_MIN_ZOOM = 0.75;
        const MAP_MAX_ZOOM = 7.5;
        hyplagRecvizModel = new HyplagRecvizModel();
        OVERALL_SIMILARITY_PERCENTAGES = hyplagRecvizModel.calculateGlobalSimilarityValue(MATCHED_DOCUMENTS, SIMILARITY_WEIGHTS, SIMILARITY_DECIMAL_PRECISION);
        documentMap = new DocumentMap(canvasId, NODE_COLOR, NODE_RADIUS, NODE_DISTANCE_MULTIPLIER, NODE_REPULSION_STRENGTH, MAP_X_SCALE, MAP_Y_SCALE, MAP_MIN_ZOOM, MAP_MAX_ZOOM, HYPLAG_DEFAULT_BACKGROUND_COLOR, SIMILARITY_TYPE_COLOR_LIST);
        documentMap.initialize(SOURCE_DOCUMENT, MATCHED_DOCUMENTS, OVERALL_SIMILARITY_PERCENTAGES);
        documentMap.setNodeClickedCallback(nodeClickedCallback);
        documentMap.setNodePositionUpdatedCallback(nodePositionUpdated);
        documentMap.setNodeMouseOverCallback(nodeMouseOver);
        documentMap.setNodeMouseOutCallback(nodeMouseOut);
        documentMap.setVisibilityChangedCallback(nodeVisibilityChanged);
        documentMap.setMapMouseOverCallback(mapMouseOver);
        documentMap.setVisibilitySimilarityThreshold(VISIBILITY_THRESHOLD);

        rightPanel = new RightPanel(weightSlidersChanged, weightsSavedButtonPressed, weightSetNameEditedButtonPressed, weightSetDeleteButtonPressed, weightSetSelected, similarityThresholdSliderChanged, SIMILARITY_TYPE_COLOR_LIST);
        rightPanel.setSliderWeights(
            SIMILARITY_WEIGHTS.text,
            SIMILARITY_WEIGHTS.citation,
            SIMILARITY_WEIGHTS.image,
            SIMILARITY_WEIGHTS.formula
        );
        rightPanel.setSimilarityThreshold(VISIBILITY_THRESHOLD);

        initializeAdvancedOptions();

        const mapLegendRootElementId = "hyplag-map";
        mapLegend = new MapLegend(mapLegendRootElementId);
        
        new ResizeSensor(jQuery('#hyplag-map'), function(){ 
            console.log("RESIZE!!!")
            const mapSize = document.getElementById("hyplag-map").getBoundingClientRect();
            const MAP_X_SCALE = mapSize.width;
            const MAP_Y_SCALE = mapSize.height;
            documentMap.updateSize(MAP_X_SCALE, MAP_Y_SCALE);
        });

        BACKEND_API_MODULE.getWeightsetList(AUTH_TOKEN, function(err, weightsetArray){
            if(!err) {
                weightsetArray.forEach(function(weightset){
                    rightPanel.pushNewSelection(weightset.name, weightset._id);
                })
                SAVED_USER_DATA.weightSetList = weightsetArray;
            } else {
                console.log("Unable to fetch weightset list.");
            }
        })

        BACKEND_API_MODULE.getResearchDisciplineWeightsetList(AUTH_TOKEN, function(err, weightsetArray){
            if(!err) {
                weightsetArray.forEach(function(weightset){
                    rightPanel.pushNewResearchDisciplineSelection(weightset.name, weightset._id);
                })
                SAVED_USER_DATA.researchDisciplineWeightSetList = weightsetArray;
            } else {
                console.log("Unable to fetch weightset list.");
            }
        })

        BACKEND_API_MODULE.getCollectedDocsList(AUTH_TOKEN, function(err, result){
            if(!err) {
                var collectedDocsObj = {};

                result.collectedDocs.forEach(function(collectedDoc){
                    const docId = collectedDoc.documentId.toString();
                    collectedDocsObj[docId] = {};
                    collectedDocsObj[docId].title = collectedDoc.title;
                    collectedDocsObj[docId].authorsList = collectedDoc.authorsList;
                })

                result.order.forEach(function(collectedDocId){
                    const docId = collectedDocId.toString();
                    const title = collectedDocsObj[docId].title;
                    const truncatedTitle = truncateString(title, COLLECTED_DOC_MAX_CHAR_NUMBER, false);
                    const authorsList = collectedDocsObj[docId].authorsList;

                    leftPanel.pushCollectedDocument(truncatedTitle, collectedDocId, authorsList);

                    var nodeData = getDocumentData(collectedDocId);
                    if(nodeData) {
                        nodeData.isCollected = true;
                        overlayerPanel.changeStarStatus(collectedDocId, true);
                    } else {
                        console.log("This collected document is not among the nodes being shown: "+docId);
                    }
                });
            } else {
                console.log("Unable to fetch collected docs list.");
            }
        })
    }
}