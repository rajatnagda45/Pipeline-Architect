import { BaseNode } from '../BaseNode';
import { delayNodeConfig } from '../nodeConfigs';

export const DelayNode = (props) => <BaseNode {...props} config={delayNodeConfig} />;
