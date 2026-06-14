import type { ComponentType } from 'react';

export type TemplateSectionEntry = {
  id: string;
  Component: ComponentType;
};

// Register your template sections here. Each Component is rendered
// in order inside <WindowFrame>. Import from src/containers/.
export const TEMPLATE_SECTIONS: TemplateSectionEntry[] = [];
