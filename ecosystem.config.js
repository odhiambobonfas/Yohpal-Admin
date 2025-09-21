module.exports = {
    apps: [{
        name: "server.js",
        script: "./server.js",
        watch: true,
        ignore_watch: [
            "*.json", "node_modules", "logs", "public", "resources", "tests", "*.ejs",
            ".gitignore"
        ]
    }]
};