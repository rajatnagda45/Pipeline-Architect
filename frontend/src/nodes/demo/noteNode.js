import { BaseNode } from '../BaseNode';
import { noteNodeConfig } from '../nodeConfigs';

export const NoteNode = (props) => <BaseNode {...props} config={noteNodeConfig} />;
