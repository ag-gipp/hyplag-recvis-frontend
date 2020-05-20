function FormulaComparison(FEATURE_ID){
    this.FEATURE_ID = FEATURE_ID;

    this.visualizeFormulaSimilarity = () => {
        console.log("Formulas are being visualized");
    }

    this.update = () => {
        console.log("this is a formula Update" + this.FEATURE_ID);
    }
}