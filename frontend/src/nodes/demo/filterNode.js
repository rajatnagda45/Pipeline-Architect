import { BaseNode } from '../BaseNode';
import { filterNodeConfig } from '../nodeConfigs';

export const FilterNode = (props) => <BaseNode {...props} config={filterNodeConfig} />;
