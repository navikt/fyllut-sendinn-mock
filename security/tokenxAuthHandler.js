const jwt = require("jsonwebtoken");

const authEnabled = process.env.AUTH_ENABLED === "true";
const tokenxClientId = process.env.TOKEN_X_CLIENT_ID;

const tokenxAuthHandler = (req, res, next) => {
    if (authEnabled) {
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            console.log("Missing jwt token");
            return res.status(401).json({message: "Missing token"});
        }

        // should verify token using jwt.verify function
        const tokenContent = jwt.decode(token, {});
        if (!tokenContent) {
            console.log("Failed to decode token");
            return res.status(401).json({message: "Failed to decode token"});
        }

        const currentTime = new Date().getTime() / 1000;
        const expired = tokenContent.exp < currentTime;
        if (expired) {
            console.log("TokenX access token is expired");
            return res.status(401).json({message: "Token expired"});
        }
        if (tokenContent.aud !== tokenxClientId) {
            console.log("Incorrect audience");
            return res.status(401).json({message: "Incorrect audience"});
        }

        req.getIdportenPid = () => tokenContent.pid;
    }
    next();
}

module.exports = tokenxAuthHandler;
