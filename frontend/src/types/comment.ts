// Comment-related TypeScript types

export interface Comment {
  id: string;
  issue_id: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  content: string;
}
