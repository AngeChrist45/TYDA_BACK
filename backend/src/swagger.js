const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API documentation",
            version: "1.0.0",
            description: "Documentation de mes APIs",
        },
        servers: [
            {
                url: "http://localhost:5000",
            },
        ],
    },
    apis: ["./src/**/*.js"]

};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
