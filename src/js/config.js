const BACKEND_URL = 'http://localhost:4000';

/* HYPLAG
const GLOBAL_FRONT_END_CONFIG = {
    MINIMUM_SIMILARITY_THRESHOLD: 0.1,
    MAXIMUM_NUMBER_OF_DOCS_SHOWN: 30,
    PROJECT_TITLE: "Welcome to Hyplag!",  
    PROJECT_BRAND: "Hyplag",
    JUMBOTRON: {
        TITLE: "Welcome to Hyplag!",
        LEAD: "A novel approach to detect disguised plagiarism in academic documents.",
        EXPLANATION: "HyPlag is a web-based tool to assist users in efficiently examining academic documents for suspicious text and citation similarities, which may point to potential plagiarism. The algorithms used by HyPlag are based on the Citation-based Plagiarism Detection concept, a novel approach developed by the Information Science Group at the University of Konstanz."
    }
}
*/

// RecVis
const GLOBAL_FRONT_END_CONFIG = {
    MINIMUM_SIMILARITY_THRESHOLD: 0.0, //0.1
    MAXIMUM_NUMBER_OF_DOCS_SHOWN: 30,
    PROJECT_TITLE: "RecVis",  
    PROJECT_BRAND: "RecVis",
    JUMBOTRON: {
        TITLE: "Welcome to RecVis",
        LEAD: "A novel approach to discover scientific literature based on Hyplag.org open source project.",
        EXPLANATION: "RecVis is a web-based tool to assist users in efficiently discovering academic documents based on user provided papers in PDF format. This project is based on Hyplag.org open source project."
    },
    OVERVIEW_CSS_PATH: "overview/style.css",
    NANO_OVERLAY_TITLE_CHAR_LIMIT: 50,
    INITIAL_SIMILARITY_WEIGHTS: {
        "text": 0.5,
        "citation": 0.5,
        "image": 0.5,
        "formula": 0.5,
    }
}