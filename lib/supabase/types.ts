export type UserRole = "admin" | "creator" | "student";
export type QrCodeType = "dynamic" | "static";
export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_text"
  | "multiple_select";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
        };
      };
      anonymous_students: {
        Row: {
          id: string;
          display_name: string;
          total_points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          total_points?: number;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          total_points?: number;
        };
      };
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          creator_id: string;
          time_limit_seconds: number | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          creator_id: string;
          time_limit_seconds?: number | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          time_limit_seconds?: number | null;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          type: QuestionType;
          order_index: number;
          points: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          type: QuestionType;
          order_index?: number;
          points?: number;
        };
        Update: {
          question_text?: string;
          type?: QuestionType;
          order_index?: number;
          points?: number;
        };
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          option_text: string;
          is_correct: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_text: string;
          is_correct?: boolean;
          order_index?: number;
        };
        Update: {
          option_text?: string;
          is_correct?: boolean;
          order_index?: number;
        };
      };
      qr_codes: {
        Row: {
          id: string;
          type: QrCodeType;
          label: string;
          location_description: string | null;
          creator_id: string;
          current_quiz_id: string | null;
          locked_question_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: QrCodeType;
          label: string;
          location_description?: string | null;
          creator_id: string;
          current_quiz_id?: string | null;
          locked_question_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          label?: string;
          location_description?: string | null;
          current_quiz_id?: string | null;
          is_active?: boolean;
        };
      };
      qr_code_assignments: {
        Row: {
          id: string;
          qr_code_id: string;
          quiz_id: string;
          assigned_by: string;
          active_from: string;
          active_until: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          qr_code_id: string;
          quiz_id: string;
          assigned_by: string;
          active_from?: string;
          active_until?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          active_until?: string | null;
          notes?: string | null;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string | null;
          question_id: string | null;
          qr_code_id: string | null;
          user_id: string | null;
          anonymous_id: string | null;
          score: number;
          max_score: number;
          time_taken_seconds: number | null;
          answers: Record<string, string | string[]>;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          quiz_id?: string | null;
          question_id?: string | null;
          qr_code_id?: string | null;
          user_id?: string | null;
          anonymous_id?: string | null;
          score: number;
          max_score: number;
          time_taken_seconds?: number | null;
          answers: Record<string, string | string[]>;
          submitted_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      qr_code_type: QrCodeType;
      question_type: QuestionType;
    };
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AnonymousStudent =
  Database["public"]["Tables"]["anonymous_students"]["Row"];
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type QuestionOption =
  Database["public"]["Tables"]["question_options"]["Row"];
export type QrCode = Database["public"]["Tables"]["qr_codes"]["Row"];
export type QrCodeAssignment =
  Database["public"]["Tables"]["qr_code_assignments"]["Row"];
export type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];

// Extended types used across the app
export type QuestionWithOptions = Question & {
  question_options: QuestionOption[];
};

export type QuizWithQuestions = Quiz & {
  questions: QuestionWithOptions[];
};

export type QrCodeWithQuiz = QrCode & {
  quiz?: QuizWithQuestions | null;
  locked_question?: QuestionWithOptions | null;
};
