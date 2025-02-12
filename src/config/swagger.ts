import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { Express } from 'express';

const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};