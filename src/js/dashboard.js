const INFO_BOX_ID = "#body-page-infobox";

var utilityLib = new UtilitiesLibrary(INFO_BOX_ID);
var backendApi = new BackendApi(BACKEND_URL);
var recvizLocalStorage = new RecvizLocalStorage();

const MAX_NUMBER_OF_CHAR_FOR_SHORT_FOLDER_NAME = 20;

function addFolderToFolderList(folderListId, folderId, folderTitle, documentCount, folderImg, folderClickedCallback) {
    var folderList = document.getElementById(folderListId);

    const truncatedFolderTitle = utilityLib.truncate.apply(folderTitle, [MAX_NUMBER_OF_CHAR_FOR_SHORT_FOLDER_NAME, true]);

    var newFolderDiv = document.createElement("div");
    newFolderDiv.className = "card m-2 cardHoverHighlight";
    newFolderDiv.style = "width: 16rem;";
    newFolderDiv.innerHTML = '<div class="card-body text-center unselectable clickable">'
                            +   '<h5 class="card-title">'+truncatedFolderTitle+'</h5> '
                            +   '<img src="'+folderImg+'" alt="triangle with all three sides equal" width="50%"/>'
                            +   ((documentCount > 1) ? ('<p class="card-text">'+documentCount+' Documents</p>') : ('<p class="card-text">'+documentCount+' Document</p>'))
                            +'</div>';
    newFolderDiv.dataset.folderId = folderId;

    newFolderDiv.setAttribute("data-toggle","tooltip");
    newFolderDiv.setAttribute("data-placement","top");
    newFolderDiv.setAttribute("title",folderTitle);
    $(newFolderDiv).tooltip()
    $(newFolderDiv).click(function(event) {
        folderClickedCallback(folderId)
    });

    folderList.appendChild(newFolderDiv);
}

function validateInputAndCreateNewFolder(jwtToken) {
    const inputVal = $("#create-folder-text-input").val();
    if(inputVal.length > 0) {
        $('#exampleModal').modal('hide');
        backendApi.createNewFolder(inputVal, jwtToken, function(err, res){
            if(!err && res.data.folderName && res.data.folderName == inputVal) {
                utilityLib.informUser("alert-success", "Succesfully created the folder.");
                location.reload();
            } else {
                utilityLib.informUser("alert-danger", "Unable to create the folder: "+err);
            }
        });
    } else {
        $("#create-new-folder-error").text("Folder name can not be empty.");
        $("#create-new-folder-error").removeClass("d-none");
    }
}
function initializeAddNewFolderCard(cardId, jwtToken){
    $("#create-folder-button").click(function(e){
        validateInputAndCreateNewFolder(jwtToken);
    })
    $('#exampleModal').on("keypress", function (e) {
        if (e.which == 13) {
            validateInputAndCreateNewFolder(jwtToken);
        }
    });
    $('#exampleModal').on('show.bs.modal', function (event) {
        var modal = $(this)
        modal.find('.modal-body input').val("")
        $("#create-new-folder-error").addClass("d-none");
    })
    $('#exampleModal').on('shown.bs.modal', function (event) {
        var modal = $(this)
        modal.find('.modal-body input').focus();
    })
}

const projectTitle = GLOBAL_FRONT_END_CONFIG.PROJECT_TITLE;
const projectBrand = GLOBAL_FRONT_END_CONFIG.PROJECT_BRAND;

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("project-title").innerHTML = projectTitle;
    document.getElementById("project-brand").innerHTML = projectBrand;

    const isTokenExists = recvizLocalStorage.isAuthTokenExists();
    if(isTokenExists) {
        const authToken = recvizLocalStorage.getAuthToken();
        backendApi.listFolders(authToken, function(err, result){
            if(!err) {
                const folderListId = "folder-list";
                var folderArray = result.data.folderArray;
                folderArray.reverse();

                folderArray.forEach(function(folderObj){
                    const folderImg = "./image/shared/folder-icon.svg";
                    addFolderToFolderList(folderListId, folderObj._id, folderObj.folderName, folderObj.fileCount, folderImg, function(folderId){
                        window.location.href = "folder.html?folderId="+folderObj._id;
                    });
                });
    
                const addFolderCardId = "add-new-folder-card";
                initializeAddNewFolderCard(addFolderCardId, authToken);
            } else {
                if(err == "token expired") {
                    recvizLocalStorage.clearToken();
                    window.location.replace("/login.html");
                } else {
                    utilityLib.informUser("alert-danger", err);
                }
            }
        })
    } else {
        utilityLib.informUser("alert-danger", "Unauthorized. Please login.");
        window.location.replace("/login.html");
    }
});