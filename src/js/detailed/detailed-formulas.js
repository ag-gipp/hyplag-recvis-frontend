function FormulaComparison(FEATURE_ID, sourceDocumentData, recommendationDocumentData, documentComparisonData) {
    this.documentNavigationIndex = 0;
    this.sourceDocumentData = sourceDocumentData;
    this.recommendationDocumentData = recommendationDocumentData;
    this.FEATURE_ID = FEATURE_ID;

    const FORMULA_DETECTION_MOCK_DATA = [
        {
            srcFormula: "<math ><mi class='similar-formula-identifier'>a</mi><mo class='similar-formula-identifier'>=</mo><mn class='similar-formula-identifier'>0</mn></math>",
            targetFormula: "<math><mi class='similar-formula-identifier'>b</mi><mo class='similar-formula-identifier'>≠</mo class='similar-formula-identifier'><mn class='similar-formula-identifier'>1</mn></math>",
            similarityScore: 0.5,
            srcCaption: "Figure 3.1",
            targetCaption: "Figure 5.6.1"
        },
        {
            srcUpperText: "Here's some context text, surrounding the formula to give the reader a bit more textual description of the formula - typically the sentences surrounding a formula will be referencing it (not allways, but very often). Vivamus tristique ex dui, vitae mattis nisi hendrerit in.Integer venenatis lacus eget sem tristique, sed sodales ipsum facilisis. Sed condimentum ornare facilisis. Aliquam a mauris nunc.",
            srcLowerText: "My Formula Caption",
            srcFormula: "$$\\class{similar-formula-identifier}x \\class{identical-formula-identifier}= { \\class{similar-formula-identifier}{-a} \\class{identical-formula-identifier}\\pm \\class{identical-formula-identifier}{\\sqrt{b^2-4ac}} \\over \\class{similar-formula-identifier}{2a}}.$$",
            srcCaption: "Figure 1.2 Equation of x",
            targetUpperText: "Duis tellus massa, egestas non accumsan a, sagittis eget nisi. Vestibulum quis gravida nunc. Aliquam erat volutpat. Some additonal 3 sentences after the formula so that the formula is not shown entirely out of the document context.  ",
            targetLowerText: "Ut dapibus augue nulla, eget dictum ipsum ornare quis. Etiam nunc turpis, suscipit vel augue sit amet, varius pellentesque dolor. Some additonal 3 sentences after the formula so that the formula is not shown entirely out of the document context.  ",
            targetFormula: "$$\\class{similar-formula-identifier}y \\class{identical-formula-identifier}= { \\class{similar-formula-identifier}{-b} \\class{identical-formula-identifier}\\pm \\class{identical-formula-identifier}{\\sqrt{b^2-4ac}} \\over \\class{similar-formula-identifier}{2b}}.$$ ",
            targetCaption: "Figure 3.2.1 Calculating y",
            similarityScore: 0.7
        },
        {
            srcFormula: "$$\\class{identical-formula-identifier}x = { \\class{identical-formula-identifier}\\sum \\class{identical-formula-identifier}{i} \\class{identical-formula-identifier}\\ast \\class{identical-formula-identifier}{9}}$$",
            targetFormula: "$$\\class{identical-formula-identifier}x = {\\class{identical-formula-identifier}{9} \\class{identical-formula-identifier}\\ast \\class{identical-formula-identifier}\\sum \\class{identical-formula-identifier}{i}}$$",
            similarityScore: 1,
            srcCaption: "Figure 2.1 x equals 9*i",
            targetCaption: "Figure 4.1.2 x"
        },
    ];
    const SOURCE_FORMULA_CONTAINER = document.getElementById("src-formula");
    const RECOMMENDATION_FORMULA_CONTAINER = document.getElementById("recommendation-formula");
    const SOURCE_CAPTION = document.getElementById("src-formula-caption");
    const RECOMMENDATION_CAPTION = document.getElementById("recommendation-formula-caption");
    const LEFT_NAV_ARROW = document.getElementById("previous-formula-match");
    const RIGHT_NAV_ARROW = document.getElementById("next-formula-match");
    const DISPLAYED_MATCH_SIMILARITY_SCORE = document.getElementById("formula-range-value");
    const SOURCE_DOCUMENT_TITLE = document.getElementById("src-document-name");
    const RECOMMENDATION_DOCUMENT_TITLE =  document.getElementById("target-document-name");
    const FORMULA_SIMILARITY_SLIDER =  document.getElementById("formula-range-control-input");

    /*
    this working copy allows the filtering of data based on the current similarity threshold
    initially there is no filtering, thus the working copy consist of the entire mock data
     */
    let mockDataWorkingCopy = FORMULA_DETECTION_MOCK_DATA;

    this.visualizeFormulaSimilarity = () => {
        SOURCE_FORMULA_CONTAINER.innerHTML = mockDataWorkingCopy[0].srcFormula;
        RECOMMENDATION_FORMULA_CONTAINER.innerHTML = mockDataWorkingCopy[0].targetFormula;
        SOURCE_CAPTION.innerText = mockDataWorkingCopy[0].srcCaption;
        RECOMMENDATION_CAPTION.innerText = mockDataWorkingCopy[0].targetCaption;
        DISPLAYED_MATCH_SIMILARITY_SCORE.innerText = mockDataWorkingCopy[0].similarityScore;

        //this tells mathjax to update the contents within the given elements -> create the formulas
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "src-formula"]);
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "recommendation-formula"]);

        SOURCE_DOCUMENT_TITLE.innerText = this.sourceDocumentData.title;
        RECOMMENDATION_DOCUMENT_TITLE.innerText = this.recommendationDocumentData.title;

        LEFT_NAV_ARROW.addEventListener('click', this.leftArrowClicked, false);
        RIGHT_NAV_ARROW.addEventListener('click', this.rightArrowClicked, false);

        FORMULA_SIMILARITY_SLIDER.addEventListener('change', this.handleFilterValueChange, false);
        FORMULA_SIMILARITY_SLIDER.addEventListener('input', this.handleFilterValueChange, false);
    };


    this.update = (srcDocumentData, recommendationDocumentData, documentComparisonData) => {
        this.sourceDocumentData = srcDocumentData;
        this.recommendationDocumentData = recommendationDocumentData;

        SOURCE_DOCUMENT_TITLE.innerText = this.sourceDocumentData.title;
        //this is where the recommendation document title is changed on update
        RECOMMENDATION_DOCUMENT_TITLE.innerText = this.recommendationDocumentData.title;
    };

    this.leftArrowClicked = (event) => {
        //at the beginning of mock data?
        if (this.documentNavigationIndex === 0) {
            //jump to the end
            this.documentNavigationIndex = mockDataWorkingCopy.length - 1;
        } else {
            --this.documentNavigationIndex;
        }
        this.handleArrowNavigation();
    };

    this.rightArrowClicked = (event) => {
        //at the end of mock data?
        if (this.documentNavigationIndex === mockDataWorkingCopy.length - 1) {
            //jump to the beginning
            this.documentNavigationIndex = 0;
        } else {
            ++this.documentNavigationIndex;
        }
        this.handleArrowNavigation();
    };

    //once the document index is updated, this function puts the content into the corresponding containers
    this.handleArrowNavigation = () => {
        SOURCE_FORMULA_CONTAINER.innerHTML = mockDataWorkingCopy[this.documentNavigationIndex].srcFormula;
        RECOMMENDATION_FORMULA_CONTAINER.innerHTML = mockDataWorkingCopy[this.documentNavigationIndex].targetFormula;

        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "src-formula"]);
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "recommendation-formula"]);

        SOURCE_CAPTION.innerText = mockDataWorkingCopy[this.documentNavigationIndex].srcCaption;
        RECOMMENDATION_CAPTION.innerText = mockDataWorkingCopy[this.documentNavigationIndex].targetCaption;
        DISPLAYED_MATCH_SIMILARITY_SCORE.innerText = mockDataWorkingCopy[this.documentNavigationIndex].similarityScore;
    };

    //positions the slider bubble and updates its value
    this.updateSliderBubble = (value) => {
        const FORMULA_SLIDER_VALUE = document.getElementById('math-slider-value');

        FORMULA_SLIDER_VALUE.innerHTML = `<span>${value}</span>`;
        FORMULA_SLIDER_VALUE.style.left = `${value*100}%`;
    };

    //called when the slider is being adjusted
    this.handleFilterValueChange = (event) => {
        const MIN_SIMILARITY_SCORE = event.target.value / 100;

        this.updateSliderBubble(MIN_SIMILARITY_SCORE);

        //here the filtering takes place which in turn allows the visualizeFormula function to only display the filtered content
        mockDataWorkingCopy = FORMULA_DETECTION_MOCK_DATA
            .filter((formulaMatch) => {
                return formulaMatch.similarityScore >= MIN_SIMILARITY_SCORE
            });

        this.documentNavigationIndex = 0;

        this.visualizeFormulaSimilarity();
    };

}