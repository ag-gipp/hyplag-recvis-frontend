function OverlayerPanel(overlayerId, starImgSrc, starGoldenImgSrc, overviewCSSPath) {
    this.overlayerId = overlayerId;
    this.childIdSuffix = "-childoverlay-"
    this.overlayerDiv = document.getElementById(overlayerId);
    this.overviewCSSPath = overviewCSSPath;

    const BASE_OVERLAY_CLASS_NAME = "baseOverlay";
    const NANO_OVERLAY_CLASS_NAME = "nanoOverlay";
    const UNSELECTABLE_CLASS_NAME = "unselectable";
    const FLEX_CONTAINER_CLASS_NAME = "FlexContainer";
    const FLEX_CENTER_CLASS_NAME = "FlexCentered";
    const FLEX_SUMMARY_OVERLAY_CLASS_NAME = "summaryOverlay";
    const FLEX_DETAILED_OVERLAY_CLASS_NAME = "detailedOverlay";
    const OVERLAY_HOVER_EFFECT_CLASS_NAME = "overlayHoverEffectReplica";
    const COLLECT_DOCUMENT_STAR_ICON_CLASS = "overlay-star-document-icon-container";

    const STAR_IMG = starImgSrc;
    const STAR_GOLDEN_IMG = starGoldenImgSrc;

    const INVISIBLE_CLASS_NAME = "invisible";

    const DIV_COUNT_IN_SUMMARY_VIEW = 5;
    const SUMMARY_CONTROL_FLEX_ORDER = 0;
    const SUMMARY_TITLE_FLEX_ORDER = 1;
    const SUMMARY_AUTHOR_FLEX_ORDER = 2;
    const SUMMARY_VENUE_FLEX_ORDER = 3;
    const SUMMARY_YEAR_FLEX_ORDER = 4;

    var OVERLAY_CLICKED_CALLBACK = null;
    var OVERLAY_HOVER_EVENT_HANDLER_CALLBACK = null;
    var OVERLAY_STAR_STATUS_CHANGED_CALLBACK = null;

    this.overviewStyleSheet = null;

    var getOverviewStyleSheet = function(overviewCSSPath) {
        for (let [key, value] of Object.entries(document.styleSheets)) {
            const isOverviewStyleSheet = value.href.endsWith(overviewCSSPath);
            if(isOverviewStyleSheet) {
                return value;
            }
        }
    }

    var getCSSRuleWithSelectorText = function(cssRules, selectorText) {
        for (let [key, value] of Object.entries(cssRules)) {
            const isCorrectSelectorText = (value.selectorText == selectorText);
            if(isCorrectSelectorText) {
                return value;
            }
        }
    }

    this.overviewStyleSheet = getOverviewStyleSheet(this.overviewCSSPath);

    if(!this.overviewStyleSheet) {
        console.log("[ERROR] Unable to find overview style sheet. Please make sure the path set correctly.");
    }

    var overlayClicked = function(overlayId) {
        if (OVERLAY_CLICKED_CALLBACK) {
            OVERLAY_CLICKED_CALLBACK(overlayId);
        }
    }

    var overlayMouseOver = function(overlayId) {
        if (OVERLAY_HOVER_EVENT_HANDLER_CALLBACK) {
            const isHovered = true;
            OVERLAY_HOVER_EVENT_HANDLER_CALLBACK(overlayId, isHovered);
        }
    }

    var overlayMouseOut = function(overlayId) {
        if (OVERLAY_HOVER_EVENT_HANDLER_CALLBACK) {
            const isHovered = false;
            OVERLAY_HOVER_EVENT_HANDLER_CALLBACK(overlayId, isHovered);
        }
    }

    var setEventHandlersForBaseOverlayDiv = function(divId, overlayId) {
        $("#" + divId).on('click', function() {
            overlayClicked(overlayId);
        });
        $("#" + divId).on('mouseenter', function() {
            overlayMouseOver(overlayId);
        });
        $("#" + divId).on('mouseleave', function() {
            overlayMouseOut(overlayId);
        });
    }

    var setStarIconImage = function(imgTag, isGolden) {
        if (isGolden) {
            imgTag.src = STAR_GOLDEN_IMG;
        } else {
            imgTag.src = STAR_IMG;
        }
    }

    var setStarIconState = function(imgTag, isClicked) {
        const isGoldenImage = isClicked;
        setStarIconImage(imgTag, isGoldenImage);
        $(imgTag).data('isClicked', isClicked);
    }

    var setEventListenersForStarIcon = function(starIconContainer, overlayId) {
        starIconContainer.addEventListener("click", function(event) {
            event.stopPropagation();
            const imageTag = event.target;

            const isClicked = $(imageTag).data('isClicked');
            setStarIconState(imageTag, !isClicked);

            if (OVERLAY_STAR_STATUS_CHANGED_CALLBACK) {
                const isDocumentStarred = $(imageTag).data('isClicked');
                OVERLAY_STAR_STATUS_CHANGED_CALLBACK(overlayId, isDocumentStarred);
            }
        });;
        $(starIconContainer).hover(function(event) {
            const imageTag = event.target;
            const isClicked = $(imageTag).data('isClicked');
            if (!isClicked) {
                const isGolden = true;
                setStarIconImage(imageTag, isGolden);
            }
        }, function() {
            const imageTag = event.target;
            const isClicked = $(imageTag).data('isClicked');
            if (!isClicked) {
                const isGolden = false;
                setStarIconImage(imageTag, isGolden);
            }
        });
    }

    var getSum = function(total, num) {
        return total + num;
    }

    this.setNanoSummaryViewContent = function(overlayId, title, firstAuthor, authorMatchList) {
        const childOverlayId = this.overlayerId + this.childIdSuffix + overlayId;;
        var overlay = document.getElementById(childOverlayId);

        if (overlay) {
            overlay.classList.remove(FLEX_SUMMARY_OVERLAY_CLASS_NAME);
            overlay.classList.remove(FLEX_DETAILED_OVERLAY_CLASS_NAME);
            if (!overlay.classList.contains(NANO_OVERLAY_CLASS_NAME)) {
                overlay.classList.add(NANO_OVERLAY_CLASS_NAME);
            }

            var divsInOverlay = overlay.getElementsByTagName("div");
            if (divsInOverlay.length == DIV_COUNT_IN_SUMMARY_VIEW) {
                var flexContainerControl = divsInOverlay[SUMMARY_CONTROL_FLEX_ORDER];
                flexContainerControl.style.display = "none";
                var flexContainerTitle = divsInOverlay[SUMMARY_TITLE_FLEX_ORDER];
                flexContainerTitle.style.display = "none";
                var flexContainerVenue = divsInOverlay[SUMMARY_VENUE_FLEX_ORDER];
                flexContainerVenue.style.display = "none";
                var flexContainerAuthor = divsInOverlay[SUMMARY_AUTHOR_FLEX_ORDER];
                flexContainerAuthor.innerHTML = "<h1> " + title + " </h1>";


                var flexContainerYear = divsInOverlay[SUMMARY_YEAR_FLEX_ORDER];
                const isAuthorMatched = (authorMatchList[0] && authorMatchList[0] > 0);
                if (isAuthorMatched) {
                    flexContainerYear.innerHTML = '<h1><span class="authorHighlightSpan">' + firstAuthor + "</span></h1>";
                } else {
                    flexContainerYear.innerHTML = "<h1> " + firstAuthor + " </h1>";
                }
            } else {
                console.log("Unexpected number of divs in nano summary: " + divsInOverlay.length);
            }
        } else {
            console.log("Nano summary view overlay id is not found: " + overlayId);
        }
    }
    this.setSummaryViewContent = function(overlayId, title, authorsArray, authorMatchList, year, venue) {
        const childOverlayId = this.overlayerId + this.childIdSuffix + overlayId;;
        var overlay = document.getElementById(childOverlayId);

        if (overlay) {
            overlay.classList.remove(NANO_OVERLAY_CLASS_NAME);
            overlay.classList.remove(FLEX_DETAILED_OVERLAY_CLASS_NAME);
            if (!overlay.classList.contains(FLEX_SUMMARY_OVERLAY_CLASS_NAME)) {
                overlay.classList.add(FLEX_SUMMARY_OVERLAY_CLASS_NAME);
            }

            var divsInOverlay = overlay.getElementsByTagName("div");
            if (divsInOverlay.length == DIV_COUNT_IN_SUMMARY_VIEW) {
                var flexContainerControl = divsInOverlay[SUMMARY_CONTROL_FLEX_ORDER];
                flexContainerControl.style.display = "none";
                var flexContainerTitle = divsInOverlay[SUMMARY_TITLE_FLEX_ORDER];
                flexContainerTitle.style.display = "flex";
                flexContainerTitle.innerHTML = "<h1> " + title + " </h1>";
               var flexContainerVenue = divsInOverlay[SUMMARY_VENUE_FLEX_ORDER];
               flexContainerVenue.style.display = "flex";
               flexContainerVenue.innerHTML = "<p>" + venue + "</p>";
                var flexContainerAuthor = divsInOverlay[SUMMARY_AUTHOR_FLEX_ORDER];

                flexContainerAuthor.innerHTML = "";
                authorsArray.forEach(function(author, i) {
                    const authorMatchIndex = authorMatchList[i];
                    if (authorMatchIndex && authorMatchIndex > 0) {
                        flexContainerAuthor.innerHTML = flexContainerAuthor.innerHTML + '<span class="authorHighlightSpan">' + author + '</span>';
                    } else {
                        flexContainerAuthor.innerHTML = flexContainerAuthor.innerHTML + author;
                    }

                    if(i < (authorsArray.length-1)) {
                        flexContainerAuthor.innerHTML  = flexContainerAuthor.innerHTML +', ';
                    }
                });
                flexContainerAuthor.innerHTML = '<p class="authorP">' + flexContainerAuthor.innerHTML + "</p>";
                var flexContainerYear = divsInOverlay[SUMMARY_YEAR_FLEX_ORDER];
                flexContainerYear.innerHTML = "<p> " + year + " </p>";
                
            } else {
                console.log("Unexpected number of divs in nano summary: " + divsInOverlay.length);
            }
        } else {

        }
    }
    this.setDetailedViewContent = function(overlayId, title, authorsArray, authorMatchList, year, venue) {
        this.setSummaryViewContent(overlayId, title, authorsArray, authorMatchList, year, venue);

        
        const childOverlayId = this.overlayerId + this.childIdSuffix + overlayId;;
        var overlay = document.getElementById(childOverlayId);
        var divsInOverlay = overlay.getElementsByTagName("div");
        var flexContainerControl = divsInOverlay[SUMMARY_CONTROL_FLEX_ORDER];
        flexContainerControl.style.display = "flex";
        

        if (!overlay.classList.contains(FLEX_DETAILED_OVERLAY_CLASS_NAME)) {
            overlay.classList.add(FLEX_DETAILED_OVERLAY_CLASS_NAME);
        }

    }
    this.setOverlayPosition = function(overlayId, mapX, mapY, width, height) {
        const childOverlayId = this.overlayerId + this.childIdSuffix + overlayId;
        var childOverlay = document.getElementById(childOverlayId);
        if (childOverlay) {
            const childX = mapX;
            const childY = mapY;
            childOverlay.style.top = (childY - height) + "px";
            childOverlay.style.left = childX + "px";
            childOverlay.style.width = width + "px";
            childOverlay.style.height = height + "px";
            childOverlay.style.fontSize = height + "px";
        }
    }
    this.createOverlay = function(overlayId) {
        var overlayDiv = document.createElement("div");
        overlayDiv.id = this.overlayerId + this.childIdSuffix + overlayId;
        overlayDiv.classList.add(BASE_OVERLAY_CLASS_NAME);
        overlayDiv.classList.add(UNSELECTABLE_CLASS_NAME);
        overlayDiv.classList.add(FLEX_CONTAINER_CLASS_NAME);
        overlayDiv.classList.add(FLEX_CENTER_CLASS_NAME);
        overlayDiv.dataset.overlayId = overlayId;

        var flexContainerControl = document.createElement("div");
        flexContainerControl.classList.add(FLEX_CONTAINER_CLASS_NAME);
        flexContainerControl.style.display = "none";
        flexContainerControl.style.flex = "0.1 1 auto";
        flexContainerControl.style.paddingTop = "0px";

        var starIconContainer = document.createElement("a");
        starIconContainer.className = COLLECT_DOCUMENT_STAR_ICON_CLASS;
        starIconContainer.innerHTML = '<img class="star-icon" src="'+STAR_IMG+'" alt="logo" />';
        setEventListenersForStarIcon(starIconContainer, overlayId);
        flexContainerControl.appendChild(starIconContainer);

        var flexContainerTitle = document.createElement("div");
        flexContainerTitle.classList.add(FLEX_CONTAINER_CLASS_NAME);
        flexContainerTitle.classList.add(FLEX_CENTER_CLASS_NAME);
        flexContainerTitle.style.display = "none";

        var flexContainerVenue = document.createElement("div");
        flexContainerVenue.classList.add(FLEX_CONTAINER_CLASS_NAME);
        flexContainerVenue.classList.add(FLEX_CENTER_CLASS_NAME);
        flexContainerVenue.style.display = "none";

        var flexContainerAuthor = document.createElement("div");
        flexContainerAuthor.classList.add(FLEX_CONTAINER_CLASS_NAME);
        flexContainerAuthor.classList.add(FLEX_CENTER_CLASS_NAME);


        var flexContainerYear = document.createElement("div");
        flexContainerYear.classList.add(FLEX_CONTAINER_CLASS_NAME);
        flexContainerYear.classList.add(FLEX_CENTER_CLASS_NAME);

        overlayDiv.appendChild(flexContainerControl);
        overlayDiv.appendChild(flexContainerTitle);
        overlayDiv.appendChild(flexContainerAuthor);
        overlayDiv.appendChild(flexContainerVenue);
        overlayDiv.appendChild(flexContainerYear);
        this.overlayerDiv.appendChild(overlayDiv);

        setEventHandlersForBaseOverlayDiv(overlayDiv.id, overlayId);
    }
    this.setOverlayClickedCallback = function(callback) {
        OVERLAY_CLICKED_CALLBACK = callback;
    }
    this.setOverlayMouseOverStatus = function(overlayId, isMouseOver) {
        const childOverlayId = this.overlayerId + this.childIdSuffix + overlayId;
        var childOverlay = document.getElementById(childOverlayId);
        if (childOverlay) {
            if (isMouseOver) {
                if (!childOverlay.classList.contains(OVERLAY_HOVER_EFFECT_CLASS_NAME)) {
                    childOverlay.classList.add(OVERLAY_HOVER_EFFECT_CLASS_NAME);
                }
            } else {
                childOverlay.classList.remove(OVERLAY_HOVER_EFFECT_CLASS_NAME);
            }
        } else {
            console.log("This overlay does not exists ID: " + overlayId);
        }
    }
    this.setOverlayHoverEventHandlerCallback = function(callback) {
        OVERLAY_HOVER_EVENT_HANDLER_CALLBACK = callback;
    }
    this.setDocumentStarStatusChangedCallback = function(callback) {
        OVERLAY_STAR_STATUS_CHANGED_CALLBACK = callback;
    }
    this.changeStarStatus = function(overlayId, starStatus) {
        const childOverlayId = this.overlayerId + this.childIdSuffix + overlayId;
        var childOverlay = document.getElementById(childOverlayId);
        var imgTags = childOverlay.getElementsByTagName("img");
        if (imgTags.length == 1) {
            const imgTag = imgTags[0];
            setStarIconState(imgTag, starStatus);
        } else {
            console.log("Unexpected number of img tag number: " + imgTags.length);
        }
    }
    this.setVisibility = function(overlayId, isVisible) {
        const childOverlayId = this.overlayerId + this.childIdSuffix + overlayId;
        var childOverlay = document.getElementById(childOverlayId);
        if (childOverlay) {
            if (isVisible) {
                childOverlay.classList.remove(INVISIBLE_CLASS_NAME);
            } else {
                if (!childOverlay.classList.contains(INVISIBLE_CLASS_NAME)) {
                    childOverlay.classList.add(INVISIBLE_CLASS_NAME);
                }
            }
        } else {
            console.log("This overlay does not exists: " + childOverlayId)
        }
    }
    this.setAuthorHighlights = function(overlayId, authorMatches) {
        const childOverlayId = this.overlayerId + this.childIdSuffix + overlayId;
        var childOverlay = document.getElementById(childOverlayId);
        const authorMatchSum = authorMatches.reduce(getSum, 0);
        if (authorMatchSum > 0) {
            //childOverlay.classList.add("overlayGreenBackground");
            //highlight matched authors.
        } else {
            //childOverlay.classList.remove("overlayGreenBackground");
        }
    }
    this.setNanoOverlayFontRatio = function(percentageValue){
        const selectorText = ".nanoOverlay div h1";
        const cssRule = getCSSRuleWithSelectorText(this.overviewStyleSheet.cssRules, selectorText);
        cssRule.style["font-size"] = percentageValue + "%";
    }
    this.setSummaryOverlayFontRatio = function(percentageValue){
        const selectorText = ".summaryOverlay div";
        const cssRule = getCSSRuleWithSelectorText(this.overviewStyleSheet.cssRules, selectorText);
        cssRule.style["font-size"] = percentageValue + "%";
    }
    this.setDetailedOverlayFontRatio = function(percentageValue){
        const selectorText = ".detailedOverlay div";
        const cssRule = getCSSRuleWithSelectorText(this.overviewStyleSheet.cssRules, selectorText);
        cssRule.style["font-size"] = percentageValue + "%";
    }

}