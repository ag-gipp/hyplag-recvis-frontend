function HyplagRecvizModel() {
    function round(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }
    
    this.calculateGlobalSimilarityValue = function (matchedDocuments, similarityWeights, decimalCount) {
        var overallSimilarities = [];

        matchedDocuments.forEach(function(matchedDoc) {
            const weightedTextSimilarity = matchedDoc.similarities.text * similarityWeights.text;
            const weightedCitationSimilarity = matchedDoc.similarities.citation * similarityWeights.citation;
            const weightedImageSimilarity = matchedDoc.similarities.image * similarityWeights.image;
            const weightedFormulaSimilarity = matchedDoc.similarities.formula * similarityWeights.formula;
            
            const weightedSimilaritiesSum = weightedTextSimilarity + weightedCitationSimilarity + weightedImageSimilarity + weightedFormulaSimilarity;
            const weightsSum = similarityWeights.text + similarityWeights.citation + similarityWeights.image + similarityWeights.formula;

            var overallSimilarity;
            if(weightsSum == 0) {
                overallSimilarity = 0;
            } else {
                overallSimilarity = weightedSimilaritiesSum / weightsSum;
            }

            overallSimilarities.push(round(overallSimilarity, decimalCount));
        });

        return overallSimilarities;
    }
}