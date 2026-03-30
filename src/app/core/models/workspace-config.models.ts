export type WorkspaceConfigSource = 'preset' | 'saved';

export interface WorkspaceConfig {
  id: string;
  label: string;
  moduleIds: string[];
  source: WorkspaceConfigSource;
}

export interface WorkspaceConfigPreset {
  id: string;
  label: string;
  moduleIds: string[];
}
