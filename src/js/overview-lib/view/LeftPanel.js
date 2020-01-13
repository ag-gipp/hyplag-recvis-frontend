function LeftPanel(removeDocumentButtonImageSource) {
    const COLLECTED_DOCUMENTS_LIST_ID = "collected-documents-list";
    const COLLECTED_DOC_COMPARE_BUTTON_ID = "collected-doc-compare";

    const COLLECTED_DOCUMENT_DIV_CLASS_NAME = "collected-document-div";
    const COLLECTED_DOCUMENT_REMOVE_ICON = "collected-document-remove-icon";

    const REMOVE_DOCUMENT_BUTTON_IMAGE_SOURCE = removeDocumentButtonImageSource;

    var COMPARE_IN_DETAIL_BUTTON_CALLBACK = null;
    var COLLECTED_DOCUMENT_ORDER_CHANGED_CALLBACK = null;
    var REMOVE_ICON_CLICKED = null;
    var COLLECTED_DOCUMENT_HOVER_STATUS_CHANGED_CALLBACK = null;
    var COLLECTED_DOCUMENT_CLICKED_CALLBACK = null;

    var leftCollapseButton = document.getElementById("left-collapse-button");
    leftCollapseButton.addEventListener('click', function() {
        $('#left-panel').toggleClass('collapsed-panel');
        $('#left-collapse-button').toggleClass('collapsed');
        $('#left-panel-inner-container').toggleClass('hidden');
        document.getElementById("left-panel-collapse-arrow").classList.toggle("rotate-270-degrees");
    });

    var compareInDetailButton = document.getElementById(COLLECTED_DOC_COMPARE_BUTTON_ID);
    compareInDetailButton.addEventListener('click', function() {
        if (COMPARE_IN_DETAIL_BUTTON_CALLBACK) {
            COMPARE_IN_DETAIL_BUTTON_CALLBACK();
        }
    });

    this.pushCollectedDocument = function(docName, nodeIndex, authorsList) {
        var foundCollectedDocumentList = document.getElementById(COLLECTED_DOCUMENTS_LIST_ID);
            var collectedDocumentListDomElement = foundCollectedDocumentList;

            var collectedDocumentDiv = document.createElement("div");
            collectedDocumentDiv.className = COLLECTED_DOCUMENT_DIV_CLASS_NAME;
            collectedDocumentDiv.innerHTML =
                '<div><img src="'+REMOVE_DOCUMENT_BUTTON_IMAGE_SOURCE+'" alt="delete button" class="' + COLLECTED_DOCUMENT_REMOVE_ICON + '"></div>' +
                '<p><b>' + docName + '</b></p>' +
                '<p>' + authorsList.join(", ") + '</p>';
            collectedDocumentDiv.dataset.nodeIndex = nodeIndex;
            $(collectedDocumentDiv).hover(function() {
                if (COLLECTED_DOCUMENT_HOVER_STATUS_CHANGED_CALLBACK) {
                    const isHoveredIn = true;
                    COLLECTED_DOCUMENT_HOVER_STATUS_CHANGED_CALLBACK(nodeIndex, isHoveredIn);
                }
            }, function() {
                if (COLLECTED_DOCUMENT_HOVER_STATUS_CHANGED_CALLBACK) {
                    const isHoveredIn = false;
                    COLLECTED_DOCUMENT_HOVER_STATUS_CHANGED_CALLBACK(nodeIndex, isHoveredIn);
                }
            });
            $(collectedDocumentDiv).click(function(event) {
                if (COLLECTED_DOCUMENT_CLICKED_CALLBACK && event.target.tagName != "BUTTON" && event.target.tagName != "IMG") {
                    COLLECTED_DOCUMENT_CLICKED_CALLBACK(nodeIndex);
                }
            });

            var icons = collectedDocumentDiv.getElementsByClassName(COLLECTED_DOCUMENT_REMOVE_ICON);
            if (icons.length == 1) {
                icons[0].addEventListener('click', function() {
                    if (REMOVE_ICON_CLICKED) {
                        REMOVE_ICON_CLICKED(collectedDocumentDiv.dataset.nodeIndex);
                    }
                });
            } else {
                console.log("Unexpected number of icons found in collected document div: " + icons.length);
            }

            collectedDocumentListDomElement.appendChild(collectedDocumentDiv);

            $("#" + COLLECTED_DOCUMENTS_LIST_ID).sortable({
                axis: "y",
                update: function(event, ui) {
                    if (COLLECTED_DOCUMENT_ORDER_CHANGED_CALLBACK) COLLECTED_DOCUMENT_ORDER_CHANGED_CALLBACK();
                }
            });
            $("#" + COLLECTED_DOCUMENTS_LIST_ID).disableSelection();
    }
    this.removeCollectedDocument = function(nodeIndex) {
        var collectedDocuments = document.getElementsByClassName(COLLECTED_DOCUMENT_DIV_CLASS_NAME);
        for (let collectedDoc of collectedDocuments) {
            if (collectedDoc.dataset.nodeIndex == nodeIndex) {
                collectedDoc.remove();
            }
        }
    };
    this.setCompareInDetailButtonClickedCallback = function(callback) {
        COMPARE_IN_DETAIL_BUTTON_CALLBACK = callback;
    }
    this.getCollectedDocumentsOrder = function() {
        var foundCollectedDocumentList = document.getElementsByClassName(COLLECTED_DOCUMENT_DIV_CLASS_NAME);

        var collectedDocOrder = [];
        Array.prototype.forEach.call(foundCollectedDocumentList, function(collectedDoc) {
            const nodeIndex = collectedDoc.dataset.nodeIndex;
            if (nodeIndex) {
                collectedDocOrder.push(collectedDoc.dataset.nodeIndex);
            } else {
                console.log("nodeIndex does not exists for this DOM element: " + collectedDoc.innerHTML);
            }
        });

        return collectedDocOrder;
    }
    this.setCollectedDocumentsOrderChangedCallback = function(callback) {
        COLLECTED_DOCUMENT_ORDER_CHANGED_CALLBACK = callback;
    }
    this.setRemoveIconClickedCallback = function(callback) {
        REMOVE_ICON_CLICKED = callback;
    }
    this.setCollectedDocumentHoverStatusChangedCallback = function(callback) {
        COLLECTED_DOCUMENT_HOVER_STATUS_CHANGED_CALLBACK = callback;
    }
    this.setCollectedDocumentClickedCallback = function(callback) {
        COLLECTED_DOCUMENT_CLICKED_CALLBACK = callback;
    }
    this.setCollectedDocumentHoverEffect = function(documentId, isHoveredOn) {
        var collectedDocuments = document.getElementsByClassName(COLLECTED_DOCUMENT_DIV_CLASS_NAME);
        for (let collectedDoc of collectedDocuments) {
            if (collectedDoc.dataset.nodeIndex == documentId) {
                if (isHoveredOn) {
                    $(collectedDoc).addClass("collected-document-div-hover-effect");
                } else {
                    $(collectedDoc).removeClass("collected-document-div-hover-effect");
                }
            }
        }
    }
    this.setAuthorMatchedEffect = function(documentId, isTurnedOn) {
        var collectedDocuments = document.getElementsByClassName(COLLECTED_DOCUMENT_DIV_CLASS_NAME);
        for (let collectedDoc of collectedDocuments) {
            if (collectedDoc.dataset.nodeIndex == documentId) {
                if (isTurnedOn) {
                    $(collectedDoc).addClass("collected-document-matched-author-effect");
                } else {
                    $(collectedDoc).removeClass("collected-document-matched-author-effect");
                }
            }
        }
    }
}