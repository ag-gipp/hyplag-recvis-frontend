function FormulaComparison(FEATURE_ID, sourceDocumentData, recommendationDocumentData, documentComparisonData) {
    this.sourceDocumentData = sourceDocumentData;
    this.recommendationDocumentData = recommendationDocumentData;
    this.FEATURE_ID = FEATURE_ID;

    const FORMULA_DETECTION_MOCK_DATA = [
        {
            srcFormula: "$$(\\class{similar-formula-identifier}{\\mathcal{F}f)(y)} \\class{identical-formula-identifier}{=} \\frac{1}{\\left(2\\pi\\right)^{n/2}}\\class{similar-formula-identifier}{\\int_{\\R^n} f(x)\\,e^{-\\mathrm{i} y \\cdot x} \\,\\mathrm{d} x}$$",
            targetFormula: "$$F(s)= \\class{similar-formula-identifier}{\\mathcal{L} \\left\\{f\\right\\}(s)} \\class{identical-formula-identifier}{=} \\class{similar-formula-identifier}{\\int_{0}^{\\infty} f(t) e^{-st} \\,\\mathrm{d}t}, \\qquad s\\in\\mathbb{C}$$",
            similarityScore: 0.5,
            srcCaption: "Figure 3.1 Fourier transformation",
            targetCaption: "Figure 5.6.1 Laplace transformation"
        },
        {
            srcUpperText: "Here's some context text, surrounding the formula to give the reader a bit more textual description of the formula - typically the sentences surrounding a formula will be referencing it (not allways, but very often). Vivamus tristique ex dui, vitae mattis nisi hendrerit in.Integer venenatis lacus eget sem tristique, sed sodales ipsum facilisis. Sed condimentum ornare facilisis. Aliquam a mauris nunc.",
            srcLowerText: "My Formula Caption",
            srcFormula: "$$\\class{similar-formula-identifier}x \\class{identical-formula-identifier}= { \\class{similar-formula-identifier}{-a} \\class{identical-formula-identifier}\\pm \\class{similar-formula-identifier}{\\sqrt{b^2-4ac}} \\over \\class{similar-formula-identifier}{2a}}.$$",
            srcCaption: "The quadratic formula",
            targetUpperText: "Duis tellus massa, egestas non accumsan a, sagittis eget nisi. Vestibulum quis gravida nunc. Aliquam erat volutpat. Some additonal 3 sentences after the formula so that the formula is not shown entirely out of the document context.  ",
            targetLowerText: "Ut dapibus augue nulla, eget dictum ipsum ornare quis. Etiam nunc turpis, suscipit vel augue sit amet, varius pellentesque dolor. Some additonal 3 sentences after the formula so that the formula is not shown entirely out of the document context.  ",
            targetFormula: "$$\\class{identical-formula-identifier}x \\class{identical-formula-identifier}= \\class{similar-formula-identifier}{- \\frac{p}{2}}\\class{identical-formula-identifier}{\\pm} \\class{similar-formula-identifier} {\\sqrt{\\frac{p^2}{4}-q}} $$ ",
            targetCaption: "The quadratic formula: normal form",
            similarityScore: 0.7
        },
        {
            srcFormula: `<math class='identical-formula-identifier' xmlns="http://www.w3.org/1998/Math/MathML" display="block"> <mi>&#x3C3;</mi> <mo>=</mo> <msqrt> <mfrac> <mn>1</mn> <mi>N</mi> </mfrac> <munderover> <mo data-mjx-texclass="OP">&#x2211;</mo> <mrow> <mi>i</mi> <mo>=</mo> <mn>1</mn> </mrow> <mi>N</mi> </munderover> <mo stretchy="false">(</mo> <msub> <mi>x</mi> <mi>i</mi> </msub> <mo>&#x2212;</mo> <mi>&#x3BC;</mi> <msup> <mo stretchy="false">)</mo> <mn>2</mn> </msup> </msqrt> </math>`,
            targetFormula: "$$\\class{identical-formula-identifier}{\\sigma = \\sqrt{ \\frac{1}{N} \\sum_{i=1}^N (x_i -\\mu)^2}}$$",
            similarityScore: 1,
            srcCaption: "Standard Deviation rendered using MathML syntax",
            targetCaption: "Standard Deviation rendered using TeX syntax"
        },
    ];
    const DISPLAYED_MATCH_SIMILARITY_SCORE = document.getElementById("formula-range-value");
    const FORMULA_SIMILARITY_SLIDER =  document.getElementById("formula-range-control-input");
    const CONTENT_CONTAINER = document.getElementById("formulas-visualization-content");
    const NAV_CONTAINER = document.getElementById("formulas-visualization-nav-bubbles");

    /*
    this working copy allows the filtering of data based on the current similarity threshold
    initially there is no filtering, thus the working copy consist of the entire mock data
     */
    let mockDataWorkingCopy = FORMULA_DETECTION_MOCK_DATA;

    this.visualizeFormulaSimilarity = () => {

        for(let i = 0 ; i < mockDataWorkingCopy.length; i++){
            //bubble init
            let navContainer = document.getElementById("formulas-visualization-nav-bubbles");
            let anchor = document.createElement("a");
            anchor.setAttribute("class","nav-bubble");
            anchor.setAttribute("href",`#overview-slide-${i+1}`)
            if(i === 0){
                anchor.setAttribute("class", "active nav-bubble");
            }
            anchor.appendChild(document.createTextNode((i+1).toString()));
            anchor.onclick = () => {
                [...navContainer.children].filter((anchor) => anchor.classList.contains("active"))[0].classList.remove("active");
                [...navContainer.children][i].classList.add("active");
                DISPLAYED_MATCH_SIMILARITY_SCORE.innerText = mockDataWorkingCopy[i].similarityScore;
            };
            navContainer.appendChild(anchor);

            //markup
            let contentContainer = document.getElementById("formulas-visualization-content");
            let content = document.createElement("div");
            content.setAttribute("class","slide");
            content.setAttribute("id", `overview-slide-${i+1}`);
            content.innerHTML = `
            <div class="formula-content-container">
                <div id="source-formula-context-${i}" class="formula-context">
                    <div id="src-document-name-${i}" class="document-title"> Source Document: ${sourceDocumentData.title}</div>
                    <div class="formula-content mathjax">
                        <p>Here's some context text, surrounding the formula to give the reader a bit more textual description of the formula - typically the sentences surrounding a formula will be referencing it (not allways, but very often). Vivamus tristique ex dui, vitae mattis nisi hendrerit in.Integer venenatis lacus eget sem tristique, sed sodales ipsum facilisis. Sed condimentum ornare facilisis. Aliquam a mauris nunc.</p>
                        <div>
                            <div id="src-formula-${i}">${mockDataWorkingCopy[i].srcFormula}</div>
                            <div id="src-formula-caption-${i}">${mockDataWorkingCopy[i].srcCaption}</div>
                        </div>
                        <p>Duis tellus massa, egestas non accumsan a, sagittis eget nisi. Vestibulum quis gravida nunc. Aliquam erat volutpat. Some additonal 3 sentences after the formula so that the formula is not shown entirely out of the document context.  </p>
                    </div>
                </div>
                <div id="recommendation-formula-context-${i}" class="formula-context">
                    <div id="recommendation-document-name-${i}" class="document-title"> Recommended Document: ${recommendationDocumentData.title}</div>
                    <div class="formula-content mathjax">
                        <p>Duis tellus massa, egestas non accumsan a, sagittis eget nisi. Vestibulum quis gravida nunc. Aliquam erat volutpat. Some additonal 3 sentences after the formula so that the formula is not shown entirely out of the document context.  </p>
                        <div>
                            <div id="recommendation-formula-${i}">${mockDataWorkingCopy[i].targetFormula}</div>
                            <div id="recommendation-formula-caption-${i}">${mockDataWorkingCopy[i].targetCaption}</div>
                        </div>
                        <p>Ut dapibus augue nulla, eget dictum ipsum ornare quis. Etiam nunc turpis, suscipit vel augue sit amet, varius pellentesque dolor. Some additonal 3 sentences after the formula so that the formula is not shown entirely out of the document context.  </p>
                    </div>
                </div>
            </div>
            `;
            contentContainer.appendChild(content);

            DISPLAYED_MATCH_SIMILARITY_SCORE.innerText = mockDataWorkingCopy[0].similarityScore;

            MathJax.Hub.Queue(["Typeset", MathJax.Hub, `src-formula-${i}`]);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, `recommendation-formula-${i}`]);

        }

        FORMULA_SIMILARITY_SLIDER.addEventListener('change', this.handleFilterValueChange, false);
        FORMULA_SIMILARITY_SLIDER.addEventListener('input', this.handleFilterValueChange, false);
    };


    this.update = (srcDocumentData, recommendationDocumentData, documentComparisonData) => {
        this.sourceDocumentData = srcDocumentData;
        this.recommendationDocumentData = recommendationDocumentData;

        for(let i = 0; i < mockDataWorkingCopy.length; i++){
            document.getElementById(`recommendation-document-name-${i}`).innerText = "Recommended Document: " + recommendationDocumentData.title;
        }
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
        let latestFilterSize = mockDataWorkingCopy.length;
        let currentFilterSize;
        this.updateSliderBubble(MIN_SIMILARITY_SCORE);

        //here the filtering takes place which in turn allows the visualizeFormula function to only display the filtered content
        mockDataWorkingCopy = FORMULA_DETECTION_MOCK_DATA
            .filter((formulaMatch) => {
                return formulaMatch.similarityScore >= MIN_SIMILARITY_SCORE
            });

        currentFilterSize = mockDataWorkingCopy.length;

        //update necessary? remove current entries and visualize new entries
        if(latestFilterSize !== currentFilterSize) {
            while (CONTENT_CONTAINER.firstChild) {
                CONTENT_CONTAINER.removeChild(CONTENT_CONTAINER.lastChild);
            }
            while (NAV_CONTAINER.firstChild) {
                NAV_CONTAINER.removeChild(NAV_CONTAINER.lastChild);
            }

            this.visualizeFormulaSimilarity();
        }
    };

}