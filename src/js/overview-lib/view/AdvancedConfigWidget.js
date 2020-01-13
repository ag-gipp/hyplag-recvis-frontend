function AdvancedConfigWidget(domIdToBeAppended, id) {
    const ENTRY_ROW_CLASSES = "FlexContainer FlexRow";
    const CONFIG_ACTION_CLASSES = "ConfigAction FlexContainer FlexCentered";
    const CONFIG_DESCRIPTION_CLASSES = "ConfigDescription";

    const BUNDLED_ROWS_DIV_CLASSES = "FlexContainer ConfigRow";
    const FLEX_FRAME_DIV_CLASSES = "FlexFrame FlexColumn";
    const FLEX_CONTAINER_CLASSES = "FlexContainer";

    const LABEL_DIV_CLASSES = "ConfigRowLabel";

    this.numberOfBundles = 0;

    var domElementToAppend = document.getElementById(domIdToBeAppended);

    var FLEX_FRAME = document.createElement("div");
    FLEX_FRAME.className = FLEX_FRAME_DIV_CLASSES;

    var FLEX_CONTAINER = document.createElement("div");
    FLEX_CONTAINER.className = FLEX_CONTAINER_CLASSES;
    FLEX_FRAME.appendChild(FLEX_CONTAINER);

    if (domElementToAppend) {
        domElementToAppend.appendChild(FLEX_FRAME);
    } else {
        console.log("ERROR, unable to find domElementToAppend");
    }

    var createEntryRow = function(inputDomElement, description) {
        var entryRow = document.createElement("div");
        entryRow.className = ENTRY_ROW_CLASSES;

        var configActionDiv = document.createElement("div");
        configActionDiv.className = CONFIG_ACTION_CLASSES
        configActionDiv.appendChild(inputDomElement);

        var configDecriptionDiv = document.createElement("div");
        configDecriptionDiv.className = CONFIG_DESCRIPTION_CLASSES;
        configDecriptionDiv.innerHTML = "<p>" + description + "</p>";

        entryRow.appendChild(configActionDiv);
        entryRow.appendChild(configDecriptionDiv);
        return entryRow;
    }

    var setUserStoppedTypingCallback = function(textInput, callback) {
        var timeout = null;
        textInput.onkeyup = function(e) {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                console.log('Input Value:', textInput.value);
                callback(textInput.value);
            }, 500);
        };
    }

    this.createTextbox = function(id, description, defaultValue, onChangeCallback) {
        var textInput = document.createElement("input");
        textInput.setAttribute("type", "text");
        textInput.setAttribute("id", id);
        textInput.setAttribute("value", defaultValue)
        setUserStoppedTypingCallback(textInput, onChangeCallback)

        return createEntryRow(textInput, description);
    }

    this.createCheckbox = function(id, description, isChecked, exampleCheckboxValueChanged) {
        var checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", id);
        if (isChecked) {
            checkbox.setAttribute("checked", "true"); //true or false doesn't matter for checked attr.
        }
        checkbox.addEventListener("change", function(event) {
            exampleCheckboxValueChanged(event.target.checked);
        });

        return createEntryRow(checkbox, description);
    }

    this.createRadioButton = function(id, description, isChecked, radioButtonGroupName, exampleRadiuoButtonsValueChanged) {
        var checkbox = document.createElement("input");
        checkbox.setAttribute("type", "radio");
        checkbox.setAttribute("id", id);
        checkbox.setAttribute("value", description);
        checkbox.setAttribute("name", radioButtonGroupName);
        if (isChecked) {
            checkbox.setAttribute("checked", "true"); //true or false doesn't matter for checked attr.
        }
        checkbox.addEventListener("change", function(event) {
            exampleRadiuoButtonsValueChanged(event.target.value);
        });

        return createEntryRow(checkbox, description);
    }

    this.createRowLabel = function(text) {
        var entryRow = document.createElement("div");
        entryRow.className = ENTRY_ROW_CLASSES;

        var rowLabelDiv = document.createElement("div");
        rowLabelDiv.className = LABEL_DIV_CLASSES
        rowLabelDiv.innerHTML = "<h1>" + text + "</h1>";

        entryRow.appendChild(rowLabelDiv);
        return entryRow;
    }

    this.displayConfigurationBundle = function(rowArray) {
        var bundleRow = document.createElement("div");
        bundleRow.className = BUNDLED_ROWS_DIV_CLASSES;

        rowArray.forEach(function(element) {
            bundleRow.appendChild(element);
        });

        if (this.numberOfBundles != 0) {
            FLEX_CONTAINER.appendChild(document.createElement("HR"));
        }
        FLEX_CONTAINER.appendChild(bundleRow);

        this.numberOfBundles++;
    }

}