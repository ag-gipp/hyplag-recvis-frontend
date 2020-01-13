function RecvizLocalStorage() {
    const AUTHORIZATION_TOKEN_NAME =  "authorization-token";

    this.isAuthTokenExists = function() {
        const token = localStorage.getItem(AUTHORIZATION_TOKEN_NAME);
        if(token) {
            return true;
        } else {
            return false;
        }
    }
    this.getAuthToken = function() {
        return localStorage.getItem(AUTHORIZATION_TOKEN_NAME);
    }
    this.saveAuthToken = function(token) {
        localStorage.setItem(AUTHORIZATION_TOKEN_NAME, token);
    }
    this.clearToken = function() {
        localStorage.removeItem(AUTHORIZATION_TOKEN_NAME);
    }
}