import { BaseNode } from './BaseNode';
import { inputNodeConfig } from './nodeConfigs';

export const InputNode = (props) => <BaseNode {...props} config={inputNodeConfig} />;
