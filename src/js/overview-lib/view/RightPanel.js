function RightPanel(weightSlidersChangedCallback, weightsSavedButtonPressed, weightSetNameEditedButtonCallback, weightSetDeleteButtonCallback, weightSetSelectedCallback, similarityThresholdSliderChanged, similarityTypeColorList) {
    var WEIGHT_SLIDERS_CHANGED_CALLBACK = weightSlidersChangedCallback;
    var WEIGHTS_SAVED_BUTTON_CALLBACK = weightsSavedButtonPressed;
    var WEIGHT_SET_EDITED_BUTTON_CALLBACK = weightSetNameEditedButtonCallback;
    var WEIGHT_SET_DELETE_BUTTON_CALLBACK = weightSetDeleteButtonCallback;
    var WEIGHT_SET_SELECTED_CALLBACK = weightSetSelectedCallback;
    var SIMILARITY_THRESHOLD_SLIDER_CHANGED = similarityThresholdSliderChanged;

    const RESEARCH_DISCIPLINE_WEIGHT_SELECTION_LIST_ID = "research-discipline-choice-list";
    const CUSTOM_WEIGHT_SELECTION_LIST_ID = "custom-weightset-choice-list";

    const WEIGHT_SELECTION_CHOICE_CLASS_NAME = "weight-selection-choice-div";
    const WEIGHT_SELECTION_RADIO_BUTTON_GROUP_NAME = "weight-selection";

    const SIMILARITY_TYPE_COLOR_LIST = similarityTypeColorList;

    var currentSimilarityValues = {
        text: 0,
        citation: 0,
        image: 0,
        formula: 0
    }

    const SLIDER_TYPES = {
        TEXT: "text",
        CITATION: "citation",
        IMAGE: "image",
        FORMULA: "formula"
    }

    var textSlider = document.getElementById("textRange");
    var citationSlider = document.getElementById("citationRange");
    var imageSlider = document.getElementById("imageRange");
    var formulaSlider = document.getElementById("formulaRange");

    var similarityThresholdSlider = document.getElementById("visibilityRange");

    const CUSTOM_CHOICE_NAME = "Custom";
    var CURRENT_CHECKED_OPTION = CUSTOM_CHOICE_NAME;

    var rightCollapseButton = document.getElementById("right-collapse-button");
    rightCollapseButton.addEventListener('click', function() {
        $('#right-panel').toggleClass('collapsed-panel');
        $('#right-collapse-button').toggleClass('collapsed');
        $('#right-panel-inner-container').toggleClass('collapsed').toggleClass('hidden');
        document.getElementById("right-panel-collapse-arrow").classList.toggle("rotate-270-degrees");
        document.getElementById("right-panel-collapse-arrow").classList.toggle("rotate-90-degrees");
    });

    function updateValueBubble(self) {
        const thumbWidth = 20;
        var control = $(self),
        controlMin = control.attr('min'),
        controlMax = control.attr('max'),
        controlVal = control.val(),
        controlThumbWidth = thumbWidth;
      
        var range = controlMax - controlMin;
        
        var position = ((controlVal - controlMin) / range) * 100;
        var positionOffset = Math.round(controlThumbWidth * position / 100) - (controlThumbWidth / 2);
        var output = control.next('output');
        
        output
        .css('left', 'calc(' + position + '% - ' + positionOffset + 'px)')
        .text(controlVal);
    }

    var setSliderOnInputCallback = function(sliderObj, sliderType) {
        sliderObj.oninput = function() {
            updateValueBubble(sliderObj);
            const newWeight = this.value / 100;
            if (sliderType == SLIDER_TYPES.TEXT) {
                currentSimilarityValues.text = newWeight;
            } else if (sliderType == SLIDER_TYPES.CITATION) {
                currentSimilarityValues.citation = newWeight;
            } else if (sliderType == SLIDER_TYPES.IMAGE) {
                currentSimilarityValues.image = newWeight;
            } else if (sliderType == SLIDER_TYPES.FORMULA) {
                currentSimilarityValues.formula = newWeight;
            } else {
                console.log("Unknown slider type!");
            }
            WEIGHT_SLIDERS_CHANGED_CALLBACK(currentSimilarityValues.text, currentSimilarityValues.citation, currentSimilarityValues.image, currentSimilarityValues.formula);
        }
    }

    setSliderOnInputCallback(textSlider, SLIDER_TYPES.TEXT);
    setSliderOnInputCallback(citationSlider, SLIDER_TYPES.CITATION);
    setSliderOnInputCallback(imageSlider, SLIDER_TYPES.IMAGE);
    setSliderOnInputCallback(formulaSlider, SLIDER_TYPES.FORMULA);

    similarityThresholdSlider.oninput = function() {
        const newThreshold = this.value;
        SIMILARITY_THRESHOLD_SLIDER_CHANGED(newThreshold);
        updateValueBubble(similarityThresholdSlider);
    }

    document.getElementById("button-save-weight").onclick = function() {
        var weightSetName = prompt("Enter weight set name", "New weight set");
        if (weightSetName != null) {
            WEIGHTS_SAVED_BUTTON_CALLBACK(weightSetName, currentSimilarityValues);
        }
    };

    document.getElementById("button-weight-edit").onclick = function() {
        if (CURRENT_CHECKED_OPTION != CUSTOM_CHOICE_NAME) {
            var weightSetName = prompt("Enter new name");
            if (weightSetName != null) {
                WEIGHT_SET_EDITED_BUTTON_CALLBACK(CURRENT_CHECKED_OPTION, weightSetName);
            }
        } else {
            alert("You can not edit custom value. Choose a saved option.")
        }
    };

    document.getElementById("button-weight-delete").onclick = function() {
        if (CURRENT_CHECKED_OPTION != CUSTOM_CHOICE_NAME) {
            WEIGHT_SET_DELETE_BUTTON_CALLBACK(CURRENT_CHECKED_OPTION);
        } else {
            alert("You can not delete custom value. Choose a saved option.")
        }
    };

    document.getElementById("textRange-dropdown-icon").onclick = function() {
        var dropDownBox = document.getElementById("textRange-dropdown-box");
        $(dropDownBox).slideToggle();
        document.getElementById("textRange-dropdown-icon").classList.toggle("rotateHalfCircle");
    };


    function radioButtonChangeHandler(event) {
        CURRENT_CHECKED_OPTION = this.value;
        if (this.value != CUSTOM_CHOICE_NAME)
            WEIGHT_SET_SELECTED_CALLBACK(this.value);
    }

    function attachEventHandlerToAllRadioButtons() {
        var radioButtons = document.querySelectorAll('input[type=radio][name="' + WEIGHT_SELECTION_RADIO_BUTTON_GROUP_NAME + '"]');

        Array.prototype.forEach.call(radioButtons, function(radio) {
            radio.addEventListener('change', radioButtonChangeHandler);
        });
    }

    attachEventHandlerToAllRadioButtons();
    
    this.setSliderWeights = function(textWeight, citationWeight, imageWeight, formulaWeight) {
        currentSimilarityValues.text = textWeight;
        currentSimilarityValues.citation = citationWeight;
        currentSimilarityValues.image = imageWeight;
        currentSimilarityValues.formula = formulaWeight;

        textSlider.value = textWeight * 100;
        citationSlider.value = citationWeight * 100;
        imageSlider.value = imageWeight * 100;
        formulaSlider.value = formulaWeight * 100;

        $('input[type="range"]').each(function() {
            updateValueBubble(this)
        });
    }
    this.pushNewSelection = function(weightName, weightsetID) {
        var weightSelectionDomElement = document.getElementById(CUSTOM_WEIGHT_SELECTION_LIST_ID);

        var choiceDiv = document.createElement("div");
        choiceDiv.className = WEIGHT_SELECTION_CHOICE_CLASS_NAME;
        choiceDiv.innerHTML =
            '<label>' +
            '<input type="radio" name="weight-selection" value="' + weightsetID + '">' +
            ' <i>' + weightName + '</i>' +
            '</label>';

        weightSelectionDomElement.insertBefore(choiceDiv, weightSelectionDomElement.firstChild);
        attachEventHandlerToAllRadioButtons();
    }
    this.pushNewResearchDisciplineSelection = function(weightName, weightsetID){
        var weightSelectionDomElement = document.getElementById(RESEARCH_DISCIPLINE_WEIGHT_SELECTION_LIST_ID);

        var choiceDiv = document.createElement("div");
        choiceDiv.className = WEIGHT_SELECTION_CHOICE_CLASS_NAME;
        choiceDiv.innerHTML =
            '<label>' +
            '<input type="radio" name="weight-selection" value="' + weightsetID + '">' +
            ' <i>' + weightName + '</i>' +
            '</label>';

        weightSelectionDomElement.appendChild(choiceDiv);
        attachEventHandlerToAllRadioButtons();
    }
    this.setCheckedOption = function(weightsetID) {
        CURRENT_CHECKED_OPTION = weightsetID;
        var radioButtons = document.querySelectorAll('input[type=radio][name="' + WEIGHT_SELECTION_RADIO_BUTTON_GROUP_NAME + '"]');

        Array.prototype.forEach.call(radioButtons, function(radioButton) {
            if (radioButton.value == weightsetID) {
                radioButton.checked = true;
            } else if (radioButton.value == CURRENT_CHECKED_OPTION) {
                radioButton.checked = false;
            }
        });
    }
    this.changeSelectionName = function(weightsetID, newWeightName) {
        var radioButtons = document.querySelectorAll('input[type=radio][name="' + WEIGHT_SELECTION_RADIO_BUTTON_GROUP_NAME + '"]');

        Array.prototype.forEach.call(radioButtons, function(radioButton) {
            if (radioButton.value == weightsetID) {
                radioButton.value = newWeightName;
                radioButton.nextElementSibling.innerHTML = newWeightName;
            }
        });
    }
    this.deleteSelection = function(weightsetID) {
        var radioButtons = document.querySelectorAll('input[type=radio][name="' + WEIGHT_SELECTION_RADIO_BUTTON_GROUP_NAME + '"]');

        Array.prototype.forEach.call(radioButtons, function(radioButton) {
            if (radioButton.value == weightsetID) {
                radioButton.parentNode.remove();
            }
        });
    }
    this.setSimilarityThreshold = function(newThresholdValue) {
        var similarityThresholdSlider = document.getElementById("visibilityRange");
        similarityThresholdSlider.value = newThresholdValue;
        updateValueBubble(similarityThresholdSlider);
    }
    this.setWeightSliderColorVisibility = function(isVisible) {
        if(isVisible) {
            $('#textRange').addClass('textSlider');
            $('#citationRange').addClass('citationSlider');
            $('#imageRange').addClass('imageSlider');
            $('#formulaRange').addClass('formulaSlider');
        } else {
            $('#textRange').removeClass('textSlider');
            $('#citationRange').removeClass('citationSlider');
            $('#imageRange').removeClass('imageSlider');
            $('#formulaRange').removeClass('formulaSlider');
        }
    }
}