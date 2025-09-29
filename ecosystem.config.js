export default {
    apps: [{
        name: "server.ts",
        script: "./server.ts",
        watch: true,
        ignore_watch: [
            "*.json", "node_modules", "logs", "public", "resources", "tests", "*.ejs",
            ".gitignore"
        ]
    }]
};