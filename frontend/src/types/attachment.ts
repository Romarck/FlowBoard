import type { User } from './auth'

export interface Attachment {
  id: string
  issue_id: string
  filename: string
  size: number
  mime_type: string
  url: string
  created_at: string
  uploader: Pick<User, 'id' | 'name' | 'avatar_url'>
}
