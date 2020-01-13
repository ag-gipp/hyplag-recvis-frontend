const projectTitle = GLOBAL_FRONT_END_CONFIG.PROJECT_TITLE;
const projectBrand = GLOBAL_FRONT_END_CONFIG.PROJECT_BRAND;

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("project-title").innerHTML = projectTitle;
    document.getElementById("project-brand").innerHTML = projectBrand;

    const backendUrl = BACKEND_URL;    
    var recvizLocalStorage = new RecvizLocalStorage();

    const INFO_BOX_ID = "#body-page-infobox";
    var utilityLib = new UtilitiesLibrary(INFO_BOX_ID);
    var backendApi = new BackendApi(backendUrl);

    const isTokenExists = recvizLocalStorage.isAuthTokenExists();
    if(isTokenExists) {
        const authToken = recvizLocalStorage.getAuthToken();
        
        var overviewUI = new OverviewUI();
        
        const queryParams = utilityLib.getAllUrlParams();
        console.log(queryParams);

        if(queryParams && queryParams.folderid && queryParams.fileid) {
            const fileId = queryParams.fileid;
            const folderId = queryParams.folderid;
            
            const foldername = queryParams.foldername;
            const filename = queryParams.filename;

            if(foldername && filename) {
                const folderUrl = "/folder.html?folderId="+folderId;
                document.getElementById("breadcrumb-folder-name").innerHTML = '<a href="'+folderUrl+'">'+foldername+"</a>";
                document.getElementById("breadcrumb-file-name").innerHTML = filename;
            }

            const minimumSimilarityThreshold = GLOBAL_FRONT_END_CONFIG.MINIMUM_SIMILARITY_THRESHOLD;
            const maximumDocumentNumberFetched = GLOBAL_FRONT_END_CONFIG.MAXIMUM_NUMBER_OF_DOCS_SHOWN;

            backendApi.getAnalysisResults(authToken, folderId, fileId, minimumSimilarityThreshold, maximumDocumentNumberFetched, function(err, res){
                if(!err) {
                    if(res.data && res.data.sourceDoc && res.data.matchedDocs) {
                        const sourceDoc = res.data.sourceDoc;
                        const matchedDocs = res.data.matchedDocs;
                        overviewUI.initialize(sourceDoc, matchedDocs, authToken, backendUrl, fileId, folderId, foldername, filename);
                    } else {
                        utilityLib.informUser("alert-danger", "Unexpected response from our service.");
                    }
                } else {
                    if(err == "token expired") {
                        recvizLocalStorage.clearToken();
                        window.location.replace("/login.html");
                    } else {
                        utilityLib.informUser("alert-danger", err);
                    }
                }
            });
        } else {
            utilityLib.informUser("alert-danger", "Folder or File ID is not found.");
        }
    } else {
        utilityLib.informUser("alert-danger", "Authorization needed. Please login.");
        window.location.replace("/login.html");
    }
});

/* Project Notes
    - Shadow effect on baseoverlays create performance issues when all nodes are in sight and there are about 15 nodes yet this effect makes it much more visually appealing.
*/