import { BaseNode } from './BaseNode';
import { outputNodeConfig } from './nodeConfigs';

export const OutputNode = (props) => <BaseNode {...props} config={outputNodeConfig} />;
