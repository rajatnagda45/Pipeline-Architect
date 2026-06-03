import { BaseNode } from '../BaseNode';
import { apiNodeConfig } from '../nodeConfigs';

export const ApiNode = (props) => <BaseNode {...props} config={apiNodeConfig} />;
