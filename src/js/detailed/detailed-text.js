function TextComparison(FEATURE_ID, sourceDocumentData, targetDocumentData) {
    this.FEATURE_ID = FEATURE_ID;
    this.sourceDocumentData = sourceDocumentData;
    this.targetDocumentData = targetDocumentData;

    this.visualizeTextSimilarity = () => {
        const [srcKeywords, targetKeywords, sharedKeywords] = this.processText();
        console.log(srcKeywords);
        console.log(targetKeywords);
        console.log(sharedKeywords);
    };

    this.update = (updatedSourceDocumentData, updatedTargetDocumentData) => {
        this.sourceDocumentData = updatedSourceDocumentData;
        this.targetDocumentData = updatedTargetDocumentData;
        this.visualizeTextSimilarity();
    };

    this.processText = () => {
        let srcOccurrenceMap = new Map();
        let targetOccurrenceMap = new Map();
        let srcWordsSorted, targetWordsSorted, identicalWordsSorted, identicalEntries = new Map();

        const srcText = this.partitionTextIntoWords(this.sourceDocumentData);
        const targetText = this.partitionTextIntoWords(this.targetDocumentData);

        srcOccurrenceMap = this.countWordFrequency(srcOccurrenceMap, srcText);
        targetOccurrenceMap = this.countWordFrequency(targetOccurrenceMap, targetText);

        console.log(srcOccurrenceMap);
        console.log(targetOccurrenceMap);

        this.simplePluralizationSearch(srcOccurrenceMap);
        this.simplePluralizationSearch(targetOccurrenceMap);

        this.sortMapByWordFrequency(srcOccurrenceMap);
        this.sortMapByWordFrequency(targetOccurrenceMap);

        this.filterIrrelevantWords(srcOccurrenceMap);
        this.filterIrrelevantWords(targetOccurrenceMap);

        srcWordsSorted = [...srcOccurrenceMap].map((data) => {
            return data[0]
        });

        targetWordsSorted = [...targetOccurrenceMap].map((data) => {
            return data[0]
        });

        this.findAndExtractIdenticalEntries(identicalEntries, srcWordsSorted, targetWordsSorted);

        //attention! here the sorting must be ascending as a lower value indicates that they were more relevant for both documents
        identicalWordsSorted = [...identicalEntries]
            .sort((a, b) => {
                return a[1] - b[1];
            })
            .map((data) => {
                return data[0];
            });

        return [srcWordsSorted, targetWordsSorted, identicalWordsSorted];
    };

    this.partitionTextIntoWords = (text) => {
        //replace gets rid of xml and html tags
        //match turns the string into an array of words
        return text.contentBody
            .replace(/<[^>]*>/g, '')
            .toLowerCase()
            .match(/\b(\w+)\b/g);
    };

    this.countWordFrequency = (wordCountMap, wordsArray) => {
        for (let i = 0; i < wordsArray.length; i++) {
            let mappedValue = wordCountMap.get(wordsArray[i]);
            if (mappedValue) {
                wordCountMap.set(wordsArray[i], mappedValue + 1);
            } else {
                wordCountMap.set(wordsArray[i], 1);
            }
        }
        return wordCountMap;
    };

    this.simplePluralizationSearch = (wordCountMap) => {
        //pluralize in its simplest form -> partially wrong, for instance a -> as.. these will be filtered anyways though
        for (let key of wordCountMap.keys()) {
            if (wordCountMap.get(key + "s")) {
                wordCountMap.set(key + "s", (wordCountMap.get(key) + wordCountMap.get(key + "s")));
                wordCountMap.delete(key);
            }
        }
    };

    //descending order
    this.sortMapByWordFrequency = (wordCountMap) => {
        wordCountMap = new Map([...wordCountMap]
            .sort((a, b) => {
                return b[1] - a[1]
            }));
    };

    this.filterIrrelevantWords = (wordCountMap) => {
        wordCountMap = new Map([...wordCountMap].filter((mapData) => {
            return mapData[0].length > 3
        }));
    };

    this.findAndExtractIdenticalEntries = (identicalEntries, srcWordsSorted, targetWordsSorted) => {

        //retrieve matches in the top 250;
        for (let k = 0; k < Math.min(srcWordsSorted.length, 250); k++) {
            for (let i = 0; i < Math.min(targetWordsSorted.length, 250); i++) {
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
    }

}