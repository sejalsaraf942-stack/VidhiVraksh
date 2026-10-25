// Research trace returned by the chat API alongside each assistant reply.
// Every step describes an operation the server actually performed for that reply.

export type TraceStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export type TraceStepId =
  | 'question_received'
  | 'safety_screening'
  | 'clarity_check'
  | 'corpus_search'
  | 'records_review'
  | 'answer_preparation';

export interface TraceRecord {
  id: string;
  title: string;
  year?: string | number | null;
  court?: string | null;
  citation?: string | null;
  kind: 'landmark_case' | 'statutory_summary';
  topic?: string | null;
  matched_terms: string[];
}

export interface TraceStep {
  id: TraceStepId;
  status: TraceStepStatus;
  outcome: string;
  details: {
    language?: string;
    mode?: string;
    method?: string;
    records_searched?: number | null;
    records_matched?: number | null;
    duration_ms?: number | null;
    records?: TraceRecord[];
    record_title?: string;
  };
}

export interface ResearchTrace {
  version: number;
  steps: TraceStep[];
}

/** Why a request failed on the client side, used to explain a failed trace. */
export type TraceFailureReason = 'generic' | 'timeout' | 'network';

export interface LegalSource {
  id: string;
  title: string;
  statute?: string;
  section?: string;
  citation?: string;
  court?: string;
  court_or_authority?: string;
  year?: string | number | null;
  topic?: string;
  holding_summary?: string;
  legal_principle?: string;
  why_it_matters?: string;
  source_name?: string;
  official_url?: string;
  limitations?: string;
  is_landmark_case?: boolean;
}
