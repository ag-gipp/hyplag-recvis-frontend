const projectTitle = GLOBAL_FRONT_END_CONFIG.PROJECT_TITLE;
const projectBrand = GLOBAL_FRONT_END_CONFIG.PROJECT_BRAND;

const jumboTitle = GLOBAL_FRONT_END_CONFIG.JUMBOTRON.TITLE;
const jumboLead = GLOBAL_FRONT_END_CONFIG.JUMBOTRON.LEAD;
const jumboExplanation = GLOBAL_FRONT_END_CONFIG.JUMBOTRON.EXPLANATION;

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("project-title").innerHTML = projectTitle;
    document.getElementById("project-brand").innerHTML = projectBrand;

    document.getElementById("jumbotron-title").innerHTML = jumboTitle;
    document.getElementById("jumbotron-lead").innerHTML = jumboLead;
    document.getElementById("jumbotron-explanation").innerHTML = jumboExplanation;
});