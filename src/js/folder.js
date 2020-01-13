const INFO_BOX_ID = "#body-page-infobox";

var utilityLib = new UtilitiesLibrary(INFO_BOX_ID);
var backendApi = new BackendApi(BACKEND_URL);
var recvizLocalStorage = new RecvizLocalStorage();

const MAX_NUMBER_OF_CHAR_FOR_SHORT_FOLDER_NAME = 20;
const FILE_CARD_STATUS_CHECK_ROUTINE_INTERVAL_SEC = 5;

function getMatchingFileCardWithFileID(fileID) {
    var fileDiv = document.getElementById(fileID);
    return fileDiv;
}

function getButtonOfFileCardDiv(fileCardDiv) {
    var button = $(fileCardDiv).find("button");
    return button;
}

function addFileToFileList(folderListId, folderId, authToken, fileId, fileName, hyplagIndex, analysisID, isAnalysisInProgress, folderImg, analyzeButtonClicked) {
    var folderList = document.getElementById(folderListId);

    const truncatedFileName = utilityLib.truncate.apply(fileName, [MAX_NUMBER_OF_CHAR_FOR_SHORT_FOLDER_NAME, false]);

    var newFileDiv = document.createElement("div");
    newFileDiv.className = "card m-2 cardHoverHighlight";
    newFileDiv.style = "width: 16rem;";
    newFileDiv.innerHTML = '<div class="card-body text-center unselectable">'
                            +   '<h5 class="card-title">'+truncatedFileName+'</h5> '
                            +   '<img class="m-1" src="'+folderImg+'" alt="triangle with all three sides equal" width="50%"/>'
                            +   '<br> <button type="button" class="btn btn-primary m-2"></button>'
                            +'</div>';

    newFileDiv.setAttribute("data-toggle","tooltip");
    newFileDiv.setAttribute("data-placement","top");
    newFileDiv.setAttribute("title",fileName);
    newFileDiv.setAttribute("id", fileId)

    $(newFileDiv).tooltip()

    var button = getButtonOfFileCardDiv(newFileDiv);
    button.click(function () {
        const buttonType = button.text()
        analyzeButtonClicked(fileId, buttonType);
        return false;
    });

    if(isAnalysisInProgress) {
        button.prop("disabled", true);
        $(newFileDiv).addClass("bg-warning")
        button.text("Analyze")

        const secondsUntilNextCheck = FILE_CARD_STATUS_CHECK_ROUTINE_INTERVAL_SEC;
        triggerStatusCheckRoutineForFileCard(folderId, fileId, authToken, secondsUntilNextCheck);
    } else {
        if(!analysisID) {
            button.text("Analyze")
        } else {
            button.text("View Result")
        }
    }


    folderList.appendChild(newFileDiv);
}

function validateInputAndUploadFiles(authToken, folderId, callback) {
    var fileInput = document.getElementById('file-input-test');
    if(fileInput.files.length > 0) {
        console.log(fileInput.files); // A FileList with all selected files
        var formData = new FormData();
        formData.append("userdocs", fileInput.files[0]);
        formData.append("folderId", folderId);

        backendApi.uploadFile(formData, authToken, function(err, res){
            if(!err) {
                const isSucceeded = true;
                callback(null, isSucceeded);
            } else {
                callback(err, null);
            }
        });
    } else {
        callback("At least 1 PDF needed.", null);
    }
}

function initializeUploadPdfCard(cardId, authToken, folderId){
    $("#upload-files-button").click(function(){
        $("#upload-files-button").prop("disabled",true);
        validateInputAndUploadFiles(authToken, folderId, function(err, res){
            if(!err) {
                console.log("SUCCESSS!!!")
                utilityLib.informUser("alert-success", "The file is successfully uploaded.");
                $('#exampleModal').modal('hide');
                location.reload();
            } else {
                $("#upload-files-button").prop("disabled",false);
                const errorDivID = "create-new-folder-error";
                $("#"+errorDivID).text(err);
                $("#create-new-folder-error").removeClass("d-none");
            }
        })
    });
    $('#exampleModal').on("keypress", function (e) {
        if (e.which == 13) {
            $("#upload-files-button").prop("disabled",true);
            validateInputAndUploadFiles(authToken, folderId, function(err, res){
                if(!err) {
                    console.log("SUCCESSS!!!")
                    utilityLib.informUser("alert-success", "The file is successfully uploaded.");
                    $('#exampleModal').modal('hide');
                    location.reload();
                } else {
                    $("#upload-files-button").prop("disabled",false);
                    const errorDivID = "create-new-folder-error";
                    $("#"+errorDivID).val(text);
                    $("#create-new-folder-error").removeClass("d-none");
                }
            });
        }
    });
    $('#exampleModal').on('show.bs.modal', function (event) {
        var modal = $(this)
        modal.find('.modal-body input').val("")
        $("#create-new-folder-error").addClass("d-none");
        $("#upload-files-button").prop("disabled",false);
    })
}

function checkFileAnalysisStatusInterval(folderId, fileId, jwtToken, seconds, callback) {
    return setInterval(function(){
        backendApi.checkAnalysisStatus(folderId, fileId, jwtToken, function(err, isAnalysisReady){
            if(!err) {
                callback(null, isAnalysisReady)
            } else {
                callback(err, null);
            }
        });
    }, seconds * 1000);
}

function setFileCardStatus(statusString, fileId) {
    var newFileDiv = getMatchingFileCardWithFileID(fileId);
    var button = getButtonOfFileCardDiv(newFileDiv);
    if(statusString == "inprogress") {
        $(newFileDiv).addClass("bg-warning")
        button.text("Analyze")
        button.prop("disabled", true);
    } else if (statusString == "ready") {
        $(newFileDiv).removeClass("bg-warning")
        button.prop("disabled", false);
        button.text("View Result")
    } else if (statusString == "waiting") {
        button.prop("disabled", true);
    } else {

    }
}

function triggerStatusCheckRoutineForFileCard(folderId, fileId, authToken, secondsUntilNextCheck) {
    var statusCheckInterval = checkFileAnalysisStatusInterval(folderId, fileId, authToken, secondsUntilNextCheck, function(err, isCreated){
        if(!err) {
            if(isCreated) {
                setFileCardStatus("ready", fileId);
                utilityLib.informUser("alert-success", "The analysis is successfully finished.");
                clearInterval(statusCheckInterval);
            } else {
                utilityLib.informUser("alert-warning", "The analysis is being processed.");
            }
        } else {
            utilityLib.informUser("alert-danger", "Unable to refresh status of the file.");
            clearInterval(statusCheckInterval);
        }
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

        const queryParams = utilityLib.getAllUrlParams();
        
        if(queryParams && queryParams.folderid) {
            const folderId = queryParams.folderid;

            backendApi.listFiles(folderId, authToken, function(err, result){
                if(!err) {
                    const folderListId = "folder-list";
                    console.log(result);
                    const receivedData = result.data;

                    if(receivedData.folderData) {
                        const folderData = receivedData.folderData;

                        console.log(folderData);
                        const folderName = folderData.folderName;
                        var fileList = folderData.files;

                        document.getElementById("breadcrumb-folder-name").innerHTML = folderName;

                        fileList.reverse();
                        fileList.forEach(function(file){
                            const folderImg = "./image/shared/pdf.svg";
                            var analyzeButtonClickedCallback = function(fileId, buttonType){
                                console.log("Button clicked: "+buttonType+" "+fileId);
                                setFileCardStatus("waiting", fileId);
                                if(buttonType == "Analyze") {
                                    backendApi.createAnalysis(folderId, fileId, authToken, function(err, isSucceeded){
                                        if(!err) {
                                            if(isSucceeded) {
                                                setFileCardStatus("inprogress", fileId);

                                                const secondsUntilNextCheck = FILE_CARD_STATUS_CHECK_ROUTINE_INTERVAL_SEC;
                                                triggerStatusCheckRoutineForFileCard(folderId, fileId, authToken, secondsUntilNextCheck);
                                            } else {
                                                utilityLib.informUser("alert-danger", "Unable to create analysis.");
                                            }
                                        } else {
                                            utilityLib.informUser("alert-danger", "Error during analysis creation: "+err);
                                        }
                                    });
                                } else if(buttonType == "View Result") {
                                    window.location.href = "overview.html?folderId="+folderId+"&fileId="+fileId+"&folderName="+folderName+"&fileName="+file.fileName;
                                } else {
                                    console.log("Error, unknown button type.");
                                }
                            };
                            addFileToFileList(folderListId, folderId, authToken, file._id, file.fileName, file.hyplagIndex, file.analysisID, file.isAnalysisInProgress, folderImg, analyzeButtonClickedCallback);
                        });
            
                        const addFolderCardId = "add-new-folder-card";
                        initializeUploadPdfCard(addFolderCardId, authToken, folderId);
                    } else {
                        utilityLib.informUser("alert-danger", "Unexpected data received from server.");
                    }
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
            utilityLib.informUser("alert-danger", "Folder ID is not found.");
        }
    } else {
        utilityLib.informUser("alert-danger", "Unauthorized. Please login.");
        window.location.replace("/login.html");
    }
});