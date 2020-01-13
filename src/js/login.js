const INFO_BOX_ID = "#body-page-infobox";

var utilityLib = new UtilitiesLibrary(INFO_BOX_ID);
var backendApi = new BackendApi(BACKEND_URL);
var recvizLocalStorage = new RecvizLocalStorage();

function validateInputAndLoginUser(e) {
    e.preventDefault();

    var usernameInputField = $('#login-username');
    var passwordInputField = $('#login-password');

    const inputMail = usernameInputField.val();
    const inputPassword = passwordInputField.val();
    if(inputMail.length > 0 && inputPassword.length > 0) {
        usernameInputField.removeClass("is-invalid");
        passwordInputField.removeClass("is-invalid");

        backendApi.loginUser(inputMail, inputPassword, function(err, res){
            if(!err) {
                console.log(res.data);
                if(res.data && res.data.isSucceded) {
                    utilityLib.informUser("alert-success", "You succesfully logged in!")
                    if(res.data.token) {
                        recvizLocalStorage.saveAuthToken(res.data.token);
                        window.location.replace("/dashboard.html");
                    } else {
                        utilityLib.informUser("alert-danger", "Error during login process.");
                    }
                } else {
                    if(res.msg) {
                        utilityLib.informUser("alert-danger", "Unable to login: "+res.msg)
                    } else {
                        utilityLib.informUser("alert-danger", "Unable to login.")
                    }
                }
            } else {
                utilityLib.informUser("alert-danger", "Error occoured, unable to login.")
            }
        })
    } else {
        if(inputMail.length == 0) {
            usernameInputField.addClass("is-invalid");
        } else {
            usernameInputField.removeClass("is-invalid");
        }

        if(inputPassword.length == 0) {
            passwordInputField.addClass("is-invalid");
        } else {
            passwordInputField.removeClass("is-invalid");
        }
    }
}

const projectTitle = GLOBAL_FRONT_END_CONFIG.PROJECT_TITLE;
const projectBrand = GLOBAL_FRONT_END_CONFIG.PROJECT_BRAND;

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("project-title").innerHTML = projectTitle;
    document.getElementById("project-brand").innerHTML = projectBrand;

    const isAuthTokenExists = recvizLocalStorage.isAuthTokenExists();
    if(isAuthTokenExists) {
        window.location.replace("/dashboard.html");
    } else {
        $("#login-button").click(validateInputAndLoginUser);
        $('#login-form').on("keypress", function (e) {
            if (e.which == 13) {
                validateInputAndLoginUser(e);
            }
        });
    }
});