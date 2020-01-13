function BackendApi(backendUrl) {
    const BACKEND_URL = backendUrl;
    const BACKEND_API = {
        LIST_FOLDERS: BACKEND_URL + "/folder/list",
        CREATE_FOLDER: BACKEND_URL + "/folder/create",
        LIST_FILES: BACKEND_URL + "/folder/list-files",
        UPLOAD_FILES: BACKEND_URL + "/folder/upload-files",
        
        REGISTER_USER: BACKEND_URL + "/user/register",
        LOGIN_USER: BACKEND_URL + "/user/login",

        CREATE_ANALYSIS: BACKEND_URL + "/analysis/create",
        CHECK_ANALYSIS: BACKEND_URL + "/analysis/check-status",
        RESULTS: BACKEND_URL + "/analysis/result",

        LIST_WEIGHTSETS: BACKEND_URL + "/userdata/weightset/list",
        ADD_WEIGHTSET: BACKEND_URL + "/userdata/weightset/add",
        REMOVE_WEIGHTSET: BACKEND_URL + "/userdata/weightset/remove",
        UPDATE_WEIGHTSET: BACKEND_URL + "/userdata/weightset/update",

        LIST_COLLECTED_DOCS: BACKEND_URL + "/userdata/collected-doc/list",
        ADD_COLLECTED_DOCS: BACKEND_URL + "/userdata/collected-doc/append",
        REMOVE_COLLECTED_DOCS: BACKEND_URL + "/userdata/collected-doc/remove",
        SET_ORDER_COLLECTED_DOCS: BACKEND_URL + "/userdata/collected-doc/set-order",

        LIST_RESEARCH_DISCIPLINE_WEIGHTSETS: BACKEND_URL + "/commonData/research-discipline-weightset/list",

        DETAILED_VIEW_COMPARE: BACKEND_URL + "/detailed-analysis/compare",
        DETAILED_VIEW_FULL_DOCUMENT_DATA: BACKEND_URL + "/detailed-analysis/document-data",
        DETAILED_VIEW_DOCUMENT_METADATA: BACKEND_URL + "/detailed-analysis/document-meta",
    }

    var sendXhrRequest = function(requestType, urlEndpoint, xhrSend, contentType, jwtToken, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open(requestType, urlEndpoint);
        if(contentType) {
            xhr.setRequestHeader('Content-Type', 'application/json');
        }
        if(jwtToken) {
            xhr.setRequestHeader('Authorization', 'Bearer '+jwtToken);
        }
        xhr.onload = function() {
            if (xhr.status === 200) {
                var responseObj = JSON.parse(xhr.responseText);
                callback(null, responseObj);
            } else {
                callback("Unable to fetch data", null);
            }
        };
        xhr.onerror = function () {
            console.log("** An error occurred during the transaction: "+xhr.status);
            callback("Connectivity error", null);
        };
        xhr.send(xhrSend);
    }

    var isSpecialErrorCodeExistsInResponseData = function(data) {
        if(data) {
            if(data.authenticationError || data.tokenExpired || data.isSucceded === false) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    var sendAuthorizedXhrRequest = function(requestMethod, apiUrl, xhrSend, contentType, jwtToken, callback) {
        sendXhrRequest(requestMethod, apiUrl, xhrSend, contentType, jwtToken, function(err, res){
            if(!err) {
                if(isSpecialErrorCodeExistsInResponseData(res.data)) {
                    if(res.data.authenticationError) {
                        callback("Unauthorized access.", null);
                    } else if (res.data.tokenExpired) {
                        callback("token expired", null);
                    } else {
                        callback((res.msg || "Unknown error."), null);
                    }
                } else if (res.data) {
                    callback(null, res);
                } else {
                    callback("Unexpected response received from the server", null);
                }
            } else {
                callback(err, null);
            }
        });
    };

    var sendJsonWithAuthorizedXhrRequest = function(requestMethod, apiUrl, requestObj, jwtToken, callback) {
        const xhrSend = JSON.stringify(requestObj);
        const contentType = "application/json";

        sendAuthorizedXhrRequest(requestMethod, apiUrl, xhrSend, contentType, jwtToken, callback);
    } 

    var sendJsonWithXhrRequest = function(requestMethod, apiUrl, requestObj, callback) {
        const xhrSend = JSON.stringify(requestObj);
        const contentType = "application/json";
        const jwtToken = null;

        sendXhrRequest(requestMethod, apiUrl, xhrSend, contentType, jwtToken, callback);
    }

    this.registerUser = function(email, password, callback) {
        const requestObj = {
            email: email,
            password: password
        }

        sendJsonWithXhrRequest("POST", BACKEND_API.REGISTER_USER, requestObj, function(err, res){
            if(!err) {
                if (res.data) {
                    callback(null, res);
                } else {
                    callback("Unexpected response received from the server", null);
                }
            } else {
                callback(err, null);
            }
        })
    }
    this.loginUser = function(email, password, callback) {
        const requestObj = {
            email: email,
            password: password
        }

        sendJsonWithXhrRequest("POST", BACKEND_API.LOGIN_USER, requestObj, function(err, res){
            if(!err) {
                if (res.data) {
                    callback(null, res);
                } else {
                    callback("Unexpected response received from the server", null);
                }
            } else {
                callback(err, null);
            }
        })
    }
    this.listFolders = function(jwtToken, callback) {
        const requestObj = {};
        sendJsonWithAuthorizedXhrRequest("GET", BACKEND_API.LIST_FOLDERS, requestObj, jwtToken, function(err, res){
            if(!err) {
                if(res.data && res.data.folderArray) {
                    callback(null, res);
                } else {
                    var receivedMsg = "";
                    if(res.msg){
                        receivedMsg = res.msg;
                    }
                    callback("Unexpected response received from server: "+receivedMsg, null);
                }
            } else {
                callback(err, null);
            }
        });
    }
    this.createNewFolder = function(newFolderName, jwtToken, callback) {
        const requestObj = {
            folderName: newFolderName
        };

        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.CREATE_FOLDER, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res);
            } else {
                callback(err, null);
            }
        });
    }
    this.listFiles = function(folderId, jwtToken, callback) {
        const requestObj = {
            folderId: folderId
        }

        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.LIST_FILES, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res);
            } else {
                callback(err, null);
            }
        });
    }
    this.getAnalysisResults = function(jwtToken, folderId, fileId, minimumSimilarityThreshold, maximumDocumentCount, callback) {
        const requestObj = {
            folderId: folderId,
            fileId: fileId,
            minimumSimilarityThreshold: minimumSimilarityThreshold,
            maximumDocumentCount: maximumDocumentCount
        }

        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.RESULTS, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res);
            } else {
                callback(err, null);
            }
        });
    }
    this.uploadFile = function(formData, jwtToken, callback) {
        const xhrSend = formData;
        const contentType = null;

        sendAuthorizedXhrRequest("POST", BACKEND_API.UPLOAD_FILES, xhrSend, contentType, jwtToken, callback);
    }
    this.createAnalysis = function(folderId, fileId, jwtToken, callback) {
        const requestObj = {
            folderId: folderId,
            fileId: fileId
        }

        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.CREATE_ANALYSIS, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.isSucceded);
            } else {
                callback(err, null);
            }
        });
    }
    this.checkAnalysisStatus = function(folderId, fileId, jwtToken, callback) {
        const requestObj = {
            folderId: folderId,
            fileId: fileId
        }

        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.CHECK_ANALYSIS, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.isAnalysisReady);
            } else {
                callback(err, null);
            }
        });
    }
    this.getWeightsetList = function(jwtToken, callback) {
        const requestObj = {};

        sendJsonWithAuthorizedXhrRequest("GET", BACKEND_API.LIST_WEIGHTSETS, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.weightsetArray);
            } else {
                callback(err, null);
            }
        });
    }
    this.addWeightset = function(jwtToken, weightName, textWeight, citationWeight, imageWeight, formulaWeight, callback) {
        const requestObj = {
            "weightsetName": weightName,
            "weightsetComponents": {"text": textWeight, "citation": citationWeight,"image": imageWeight,"formula": formulaWeight}
        }
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.ADD_WEIGHTSET, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.weightsetID);
            } else {
                callback(err, null);
            }
        });
    }
    this.deleteWeightset = function(jwtToken, weightsetID, callback) {
        const requestObj = {
            "weightsetID": weightsetID,
        };
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.REMOVE_WEIGHTSET, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.isSucceded);
            } else {
                callback(err, null);
            }
        });
    }
    this.editWeightsetName = function(jwtToken, weightsetID, newWeightsetName, callback) {
        const requestObj = {
            "weightsetID": weightsetID,
            "weightsetName": newWeightsetName
        };
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.UPDATE_WEIGHTSET, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.isSucceded);
            } else {
                callback(err, null);
            }
        });
    }
    this.getCollectedDocsList = function(jwtToken, callback) {
        const requestObj = {};

        sendJsonWithAuthorizedXhrRequest("GET", BACKEND_API.LIST_COLLECTED_DOCS, requestObj, jwtToken, function(err, res){
            if(!err) {
                const result = {
                    collectedDocs: res.data.collectedDocs,
                    order: res.data.order
                }
                callback(null, result);
            } else {
                callback(err, null);
            }
        });
    }
    this.addCollectedDoc = function(jwtToken, collectedDocID, title, authorsList, callback) {
        const requestObj = {
            "documentId": collectedDocID,
            "documentTitle": title,
            "authorsList": authorsList
        };
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.ADD_COLLECTED_DOCS, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.isSucceded);
            } else {
                callback(err, null);
            }
        });
    }
    this.removeCollectedDoc = function(jwtToken, collectedDocID, callback) {
        const requestObj = {
            "documentId": collectedDocID
        };
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.REMOVE_COLLECTED_DOCS, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.isSucceded);
            } else {
                callback(err, null);
            }
        });
    }
    this.setCollectedDocOrder = function(jwtToken, orderList, callback) {
        const requestObj = {
            "documentOrderList": orderList
        };
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.SET_ORDER_COLLECTED_DOCS, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.isSucceded);
            } else {
                callback(err, null);
            }
        });
    }
    this.getResearchDisciplineWeightsetList = function(jwtToken, callback) {
        const requestObj = {};

        sendJsonWithAuthorizedXhrRequest("GET", BACKEND_API.LIST_RESEARCH_DISCIPLINE_WEIGHTSETS, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.weightsetArray);
            } else {
                callback(err, null);
            }
        });
    }
    this.detailedViewCompare = function(jwtToken, sourceDocId, targetDocId, callback) {
        const requestObj = {
            "sourceDocumentID": sourceDocId,
            "targetDocumentID": targetDocId
        };
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.DETAILED_VIEW_COMPARE, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.algorithmResults);
            } else {
                callback(err, null);
            }
        });
    }
    this.fetchDocumentFullData = function(jwtToken, documentId, callback) {
        const requestObj = {
            "documentID": documentId
        };
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.DETAILED_VIEW_FULL_DOCUMENT_DATA, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.documentData);
            } else {
                callback(err, null);
            }
        });
    }
    this.fetchDocumentMetadata = function(jwtToken, documentId, callback) {
        const requestObj = {
            "documentID": documentId
        };
        sendJsonWithAuthorizedXhrRequest("POST", BACKEND_API.DETAILED_VIEW_DOCUMENT_METADATA, requestObj, jwtToken, function(err, res){
            if(!err) {
                callback(null, res.data.metadata);
            } else {
                callback(err, null);
            }
        });
    }
}