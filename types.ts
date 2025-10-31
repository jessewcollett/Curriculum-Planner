export interface Unit {
  id: string;
  title: string;
  days: number;
  task: string;
  category: 'Performance' | 'Technical Theatre' | 'Other';
}

export interface Skill {
  name: string;
  checked: boolean;
}

export interface GeneratedDoc {
  id: string;
  title: string;
  type: 'Year at a Glance' | 'Unit Overviews' | 'Daily Lesson Plans (Google Doc)' | 'Slide Decks (Google Slides)' | 'error';
  content: string;
}

export interface AssessmentGroup {
  groupName: string;
  tasks: string[];
}

export interface AssessmentCategory {
  category: string;
  icon: string;
  groups: AssessmentGroup[];
}

export type DragData = 
  | { type: 'unit-bank'; id: string }
  | { type: 'unit-planner'; id: string }
  | { type: 'assessment'; task: string };

export type GradeLevel = 'K' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
