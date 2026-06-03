import { BaseNode } from './BaseNode';
import { llmNodeConfig } from './nodeConfigs';

export const LLMNode = (props) => <BaseNode {...props} config={llmNodeConfig} />;
