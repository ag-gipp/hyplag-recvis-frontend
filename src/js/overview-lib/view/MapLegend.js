function MapLegend(domIdToBeAppended) {
    var domElementToAppend = document.getElementById(domIdToBeAppended);

    var mapLegendDiv = document.createElement("div");
    mapLegendDiv.className = "mapLegend";
    
    var mapLegendDivText = document.createElement("p");
    mapLegendDivText.className = "unselectable mapLegendText";
    mapLegendDivText.innerHTML = "<b>LEGEND</b>";
    mapLegendDiv.appendChild(mapLegendDivText);
    
    var mapLegendBodyDiv = document.createElement("div");
    mapLegendBodyDiv.className = "mapLegendBody disappearAnim";
    mapLegendBodyDiv.innerHTML = '<div class="mapLegendBodyItem"><div class="mapLegendItemHeader"><img src="../../../image/overview/branches-icon.png"></img> </div> <div class="mapLegendItemBody"> <p class="unselectable">Branches refers to similarity percentages of individual types of text, citation, image and formula similarity. Their size depends on their percentages. Hover on them to learn which node type is it.</p></div></div>'
                                 +'<div class="mapLegendBodyItem"><div class="mapLegendItemHeader"><img src="../../../image/overview/star-golden.png"></img> </div> <div class="mapLegendItemBody"> <p class="unselectable">Bookmark documents for later comparison.</p></div></div>'
                                 +'<div class="mapLegendBodyItem"><div class="mapLegendItemHeader"><img src="../../../image/overview/author-highlight.png"></img> </div> <div class="mapLegendItemBody"> <p class="unselectable">Authors matching with the source document are highlighted in green.</p></div></div>'
                                 +'<div class="mapLegendBodyItem"><div class="mapLegendItemHeader"><img src="../../../image/overview/connection-length.png"></img> </div> <div class="mapLegendItemBody"> <p class="unselectable">Shorter and thicker connections indicate higher similarity. Percentage value in node itself shows exact combined similarity value.</p></div></div>'
    mapLegendDiv.appendChild(mapLegendBodyDiv);
    
    var SHRINKED_HEIGHT = "0";
    
    const AVAILABLE_STATES = {
        SHRINKED: "shrink",
        TRANSITION: "transition",
        EXPANDED: "expanded"
    }
    var CURRENT_STATE = AVAILABLE_STATES.SHRINKED;
    var LAST_STATE = AVAILABLE_STATES.SHRINKED;
    
    function triggerMapLegendFadeIn() {
        $(mapLegendBodyDiv).removeClass("disappearAnim");
        $(mapLegendBodyDiv).addClass("appearAnim");
    }
    
    function triggerMapLegendFadeOut() {
        $(mapLegendBodyDiv).removeClass("appearAnim");
        $(mapLegendBodyDiv).addClass("disappearAnim");
    }
    
    function stateChanged(oldState, newState) {
        console.log("State change: "+oldState+" -> "+newState);
        if(oldState == AVAILABLE_STATES.TRANSITION && newState == AVAILABLE_STATES.EXPANDED) {
            triggerMapLegendFadeIn();
        } else if (oldState == AVAILABLE_STATES.EXPANDED && newState == AVAILABLE_STATES.TRANSITION) {
            triggerMapLegendFadeOut();
        } else if (oldState == AVAILABLE_STATES.SHRINKED && newState == AVAILABLE_STATES.TRANSITION) {
            mapLegendBodyDiv.style.display = "flex";
        } else if (oldState == AVAILABLE_STATES.TRANSITION && newState == AVAILABLE_STATES.SHRINKED) {
            mapLegendBodyDiv.style.display = "none";
        }
    }
    
    function updateState(newState) {
        if(CURRENT_STATE != newState) {
            LAST_STATE = CURRENT_STATE;
            CURRENT_STATE = newState;
            stateChanged(LAST_STATE, CURRENT_STATE);
        }
    }

    function transitionStarted(e) {
        if(e.propertyName == "height") {
            updateState(AVAILABLE_STATES.TRANSITION)
        }
        
    }
    
    function transitionEnded(e) {
        if(e.propertyName == "height") {
            const currentMapLegendHeight = mapLegendDiv.clientHeight;
            if(currentMapLegendHeight <= SHRINKED_HEIGHT * 2) {
                updateState(AVAILABLE_STATES.SHRINKED)
            } else {
                updateState(AVAILABLE_STATES.EXPANDED)
            }
        }
    }
    
    var isExpanded = false;
    function handleClickEvent() {
        if(!isExpanded) {
            $(mapLegendDiv).addClass("mapLegendExpanded");
            isExpanded = true;
        } else {
            $(mapLegendDiv).removeClass("mapLegendExpanded");
            isExpanded = false;
        }
    }

    mapLegendDiv.addEventListener("webkitTransitionstart", transitionStarted);
    mapLegendDiv.addEventListener("webkitTransitionEnd", transitionEnded);
    
    mapLegendDiv.addEventListener("transitionstart", transitionStarted);
    mapLegendDiv.addEventListener("transitionend", transitionEnded);
    
    mapLegendDivText.addEventListener("click", handleClickEvent);
    
    if (domElementToAppend) {
        domElementToAppend.appendChild(mapLegendDiv);
        const mapLegendShrinkedHeight = mapLegendDiv.clientHeight;
        SHRINKED_HEIGHT = mapLegendShrinkedHeight;
    } else {
        console.log("ERROR, unable to find domElementToAppend");
    }
}