import { BaseNode } from '../BaseNode';
import { mathNodeConfig } from '../nodeConfigs';

export const MathNode = (props) => <BaseNode {...props} config={mathNodeConfig} />;
