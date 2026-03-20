import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Esparex API',
            version: '1.0.0',
            description: 'API Documentation for Esparex Marketplace',
        },
        servers: [
            {
                url: '/api/v1',
                description: 'V1 API Server',
            },
            {
                url: '/api/v1/admin',
                description: 'Admin API (versioned)',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Paths to files containing OpenAPI definitions
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
