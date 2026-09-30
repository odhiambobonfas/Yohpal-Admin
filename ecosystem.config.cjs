module.exports = {
    apps: [{
        name: "yohpal-admin",
        script: "./server.ts",
        interpreter: "node",
        interpreter_args: "--import tsx",
        watch: true,
        ignore_watch: [
            "*.json", "node_modules", "logs", "public", "resources", "tests", "*.ejs",
            ".gitignore"
        ]
    }]
};