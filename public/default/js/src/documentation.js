class Documentation {
    constructor() {
        // ANY LOGIC APPLICABLE
        this.swaggerBundler = undefined;
        this.initSwaggerBundler();
    }

    initSwaggerBundler() {
        this.swaggerBundler = SwaggerUIBundle;
    }

    documentationParser() {
        this.swaggerBundler({
            url: `${window.location.href}store/docs/documentation.yaml`,
            dom_id: "#swagger-ui",
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const documentationInst = new Documentation();
    documentationInst.documentationParser();
});
