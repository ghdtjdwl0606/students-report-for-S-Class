
export interface SectionConfig {
  id: string;
  name: string;
  questionCount: number;
  color: string;
}

export interface Question {
  id: string;
  number: number;
  sectionId: string; // Changed from section union to sectionId string
  category: string;
  correctAnswer: string;
  points: number;
}

export interface StudentInput {
  name: string;
  answers: Record<string, string>;
}

export interface CategoryResult {
  category: string;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  sectionName: string;
}

export interface EvaluationResult {
  studentName: string;
  totalScore: number;
  scoreBySection: Record<string, number>;
  maxScoreBySection: Record<string, number>; // 섹션별 만점 추가
  categoryResults: CategoryResult[];
  isCorrect: Record<string, boolean>;
}
