function TextComparison(FEATURE_ID, sourceDocumentData, targetDocumentData, documentComparisonData) {
    this.FEATURE_ID = FEATURE_ID;
    this.sourceDocumentData = sourceDocumentData;
    this.targetDocumentData = targetDocumentData;

    const STOP_WORDS = ["a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your", "ain't", "aren't", "can't", "could've", "couldn't", "didn't", "doesn't", "don't", "hasn't", "he'd", "he'll", "he's", "how'd", "how'll", "how's", "i'd", "i'll", "i'm", "i've", "isn't", "it's", "might've", "mightn't", "must've", "mustn't", "shan't", "she'd", "she'll", "she's", "should've", "shouldn't", "that'll", "that's", "there's", "they'd", "they'll", "they're", "they've", "wasn't", "we'd", "we'll", "we're", "weren't", "what'd", "what's", "when'd", "when'll", "when's", "where'd", "where'll", "where's", "who'd", "who'll", "who's", "why'd", "why'll", "why's", "won't", "would've", "wouldn't", "you'd", "you'll", "you're", "you've", "subscript","superscript"];
    const KEYWORDS_LEGEND = document.getElementById("keyword-legend");
    const KEYWORDS_LEGEND_TOGGLE = document.getElementById("keyword-legend-toggle");
    const KEYWORDS_LEGEND_TOGGLE_LABEL = document.getElementById("keyword-legend-toggle-label");
    const COLUMN_PREFIXES = ["column--src-", "column--target-", "column--identical-"];
    const TRANSITION_DURATION_IN_MS = 400;
    const DEFAULT_FONT_SIZE_IN_PX = 16;
    const HIGHEST_FONT_SCALING_FACTOR = 1.25;
    const MARGIN = 1.75;
    /*
    An approach to calculate the maximum number of words depending on the container height
    The calculation needs to be based on the center column which has the biggest font-size (125%)
     */
    const MOST_WORDS_PER_COLUMN = Math.floor(document.getElementById("detailed-view-wrapper").clientHeight / (MARGIN*HIGHEST_FONT_SCALING_FACTOR*DEFAULT_FONT_SIZE_IN_PX ));

    //adds EventListener to the legend - the transitions are handled by the css styling
    this.initializeLegendToggle = () => {
        KEYWORDS_LEGEND_TOGGLE.innerText = "▼";

        KEYWORDS_LEGEND_TOGGLE.addEventListener("click", () => {
            if(KEYWORDS_LEGEND.classList.contains('hidden')){
                KEYWORDS_LEGEND.classList.remove('hidden');
                KEYWORDS_LEGEND_TOGGLE.classList.remove('hidden');
                KEYWORDS_LEGEND_TOGGLE_LABEL.classList.remove('hidden');
                setTimeout(() => { KEYWORDS_LEGEND_TOGGLE.innerText = "▲"}, TRANSITION_DURATION_IN_MS);
            }else{
                KEYWORDS_LEGEND.classList.add('hidden');
                KEYWORDS_LEGEND_TOGGLE.classList.add('hidden');
                KEYWORDS_LEGEND_TOGGLE_LABEL.classList.add('hidden');
                setTimeout(() => { KEYWORDS_LEGEND_TOGGLE.innerText = "▼"}, TRANSITION_DURATION_IN_MS);
            }
        }, false);
    };

    this.initializeLegendToggle();

    this.visualizeTextSimilarity = () => {
        //retrieve keyword arrays
        const [srcKeywords, recommendationKeywords, sharedKeywords] = this.processText();

        //place words within their corresponding columns
        this.placeSourceWords(srcKeywords);
        this.placeRecommendationWords(recommendationKeywords);
        this.placeIdenticalWords(sharedKeywords);

    };

    //resets each column and triggers visualization anew
    this.update = (updatedSourceDocumentData, updatedTargetDocumentData) => {
        this.sourceDocumentData = updatedSourceDocumentData;
        this.targetDocumentData = updatedTargetDocumentData;
        this.clearColumns();
        this.visualizeTextSimilarity();
    };

    //turns the documents data into three arrays of sorted keywords
    this.processText = () => {
        let srcOccurrenceMap = new Map(),
            recommendationOccurrenceMap = new Map(),
            identicalEntries = new Map();
        let srcWordsSorted, recommendationWordsSorted, identicalWordsSorted;

        const SRC_TEXT = this.partitionTextIntoWords(this.sourceDocumentData);
        const RECOMMENDATION_TEXT = this.partitionTextIntoWords(this.targetDocumentData);

        srcOccurrenceMap = this.countWordFrequency(srcOccurrenceMap, SRC_TEXT);
        recommendationOccurrenceMap = this.countWordFrequency(recommendationOccurrenceMap, RECOMMENDATION_TEXT);

        srcOccurrenceMap = this.simplePluralizationSearch(srcOccurrenceMap);
        recommendationOccurrenceMap = this.simplePluralizationSearch(recommendationOccurrenceMap);

        srcOccurrenceMap = this.sortMapByWordFrequency(srcOccurrenceMap);
        recommendationOccurrenceMap = this.sortMapByWordFrequency(recommendationOccurrenceMap);

        srcOccurrenceMap = this.filterIrrelevantWords(srcOccurrenceMap);
        recommendationOccurrenceMap = this.filterIrrelevantWords(recommendationOccurrenceMap);

        /*
        now that the map is sorted, the absolute occurrence frequency (data[1]) of each word is no longer needed
        we generate an array of words from our maps
        */
        srcWordsSorted = [...srcOccurrenceMap].map((data) => {
            return data[0]
        });

        recommendationWordsSorted = [...recommendationOccurrenceMap].map((data) => {
            return data[0]
        });

        [identicalEntries, srcWordsSorted, recommendationWordsSorted] = this.findAndExtractIdenticalEntries(identicalEntries, srcWordsSorted, recommendationWordsSorted);

        //attention! here the sorting must be ascending as a lower value indicates that they were more relevant for both documents
        identicalWordsSorted = [...identicalEntries]
            .sort((a, b) => {
                return a[1] - b[1];
            })
            .map((data) => {
                return data[0];
            });

        return [srcWordsSorted, recommendationWordsSorted, identicalWordsSorted];
    };

    this.partitionTextIntoWords = (text) => {
        /*
        replace gets rid of xml and html tags
        match turns the string into an array of words
        */
        return text.contentBody
            .replace( /(<([^>]+)>)/ig, ' ')
            .toLowerCase()
            .match(/\b(\w+)\b/g);
    };

    this.countWordFrequency = (wordCountMap, wordsArray) => {
        for (let i = 0; i < wordsArray.length; i++) {
            let mappedValue = wordCountMap.get(wordsArray[i]);
            //if a word exists, increment its count
            if (mappedValue) {
                wordCountMap.set(wordsArray[i], mappedValue + 1);
            }
            //else, initialize count with 1
            else {
                wordCountMap.set(wordsArray[i], 1);
            }
        }
        return wordCountMap;
    };

    this.simplePluralizationSearch = (wordCountMap) => {
        /*
        pluralize in its simplest form -> partially wrong, for instance a -> as.. these will be filtered anyways though
        it returns decent results for our use case
        */
        for (let key of wordCountMap.keys()) {
            if (wordCountMap.get(key + "s")) {
                wordCountMap.set(key + "s", (wordCountMap.get(key) + wordCountMap.get(key + "s")));
                wordCountMap.delete(key);
            }
        }
        return wordCountMap;
    };

    this.sortMapByWordFrequency = (wordCountMap) => {
        let sortedWordCountMap = new Map([...wordCountMap]
            .sort((a, b) => {
                //descending order
                return b[1] - a[1]
            }));
        return sortedWordCountMap;
    };

    this.filterIrrelevantWords = (wordCountMap) => {
        //filters words of length <= 3 and those which are part of the STOP_WORDS array
        wordCountMap = new Map([...wordCountMap].filter((mapData) => {
            return (mapData[0].length > 3) && (STOP_WORDS.indexOf(mapData[0]) === -1);
        }));
        return wordCountMap;
    };

    this.findAndExtractIdenticalEntries = (identicalEntries, srcWordsSorted, targetWordsSorted) => {

        /*retrieve matches in the top 500
        if there are less than 500 words in an array, each available word is being checked*/
        for (let k = 0; k < Math.min(srcWordsSorted.length, 500); k++) {
            for (let i = 0; i < Math.min(targetWordsSorted.length, 500); i++) {
                if (srcWordsSorted[k] === targetWordsSorted[i])
                    identicalEntries.set(srcWordsSorted[k], i + k);
            }
        }

        //remove identical entries from the sorted arrays
        let k = srcWordsSorted.length;
        while (k--) {
            if (identicalEntries.get(srcWordsSorted[k]))
                srcWordsSorted.splice(k, 1);
        }

        k = targetWordsSorted.length;
        while (k--) {
            if (identicalEntries.get(targetWordsSorted[k]))
                targetWordsSorted.splice(k, 1);
        }

        return [identicalEntries, srcWordsSorted, targetWordsSorted];
    };

    this.clearColumns = () => {
        let columnsContainer = document.getElementById("text-columns-container");
        let columns = columnsContainer.children;

        //delete old entries
        for(let i = 0 ; i < columns.length ; i++){
            let column = columns[i];
            while(column.firstChild){
                column.removeChild(column.lastChild);
            }
        }
    };

    this.placeWordsInColumns = (COLUMN_COUNT, COLUMN_PREFIX, MOST_WORDS_PER_COLUMN, KEYWORDS) => {
        for(let i = COLUMN_COUNT ; i >= 1 ; i--){
            let column = document.getElementsByClassName(COLUMN_PREFIX+i)[0];
            /*
            by decrementing the upper border of k each i-iteration, the columns with less important words also receive less entries
            in combination with the styling properties display:flex, flex-direction:column and justify-content:center, the browser does the layouting in each column for us
            */
            for(let k = (i-1)* MOST_WORDS_PER_COLUMN ; k <= i*MOST_WORDS_PER_COLUMN - i*3; k++){
                if(KEYWORDS[k]){
                    let div = document.createElement('div');
                    div.innerText = KEYWORDS[k];
                    div.style.marginBottom= `5px`;
                    column.appendChild(div);
                }
                else{
                    break;
                }
            }
        }
    };

    this.placeSourceWords = (srcKeywords) => {
        const COLUMN_COUNT = 4;
        const COLUMN_PREFIX = COLUMN_PREFIXES[0];

        this.placeWordsInColumns(COLUMN_COUNT, COLUMN_PREFIX, MOST_WORDS_PER_COLUMN, srcKeywords);
    };

    this.placeRecommendationWords = (recommendationKeywords) => {
        const COLUMN_COUNT = 4;
        const COLUMN_PREFIX = COLUMN_PREFIXES[1];

        this.placeWordsInColumns(COLUMN_COUNT, COLUMN_PREFIX, MOST_WORDS_PER_COLUMN, recommendationKeywords);
    };

    this.placeIdenticalWords = (identicalKeyWords) => {
        const COLUMN_PREFIX = COLUMN_PREFIXES[2];

        //fill center column
        for(let i = 0 ; i < MOST_WORDS_PER_COLUMN ; i++){
            let column = document.getElementsByClassName(COLUMN_PREFIX+3)[0];
            let div = document.createElement('div');
            div.innerText = identicalKeyWords[i];
            div.style.marginBottom = '5px';
            column.appendChild(div);
        }

        //fill outer columns
        for(let i = 1 ; i<=2 ; i++) {
            let leftColumn = document.getElementsByClassName(COLUMN_PREFIX+(3-i))[0];
            let rightColumn = document.getElementsByClassName(COLUMN_PREFIX+(3+i))[0];

            //now that two columns are being filled at the same time, the upper bound needs to be doubled to keep the view consistent
            for (let k = i*MOST_WORDS_PER_COLUMN; k <  i*MOST_WORDS_PER_COLUMN + 2*MOST_WORDS_PER_COLUMN - (i*6); k++) {
                if(identicalKeyWords[k]){
                    let div = document.createElement('div');
                    div.innerText = identicalKeyWords[k];
                    div.style.marginBottom = '5px';

                    if (k % 2 === 0) {
                        leftColumn.appendChild(div);
                    } else {
                        rightColumn.appendChild(div);
                    }
                }
                else{
                    //there are no keyword entries left
                    break;
                }
            }
        }
    };

}
