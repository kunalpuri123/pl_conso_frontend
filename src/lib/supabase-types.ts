// Type definitions for the Merkle Automation Platform

export type AppRole = 'admin' | 'user';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  
}

interface DownloadItem {
  run_file_id: string;
  filename: string;
  storage_path: string;
  file_type: string;
  project_name: string | null;
  site_name: string | null;
  user_full_name: string | null;
  scope: string | null;
  run_uuid: string;
  file_created_at: string;

  // ⭐ ADD THIS
  automation_slug: string | null;
}


export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Site {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface Run {
  id: string;
  run_uuid: string;
  user_id: string | null;
  project_id: string | null;
  site_id: string | null;
  scope: string | null;
  crawl_filename: string | null;
  master_filename: string | null;
  status: RunStatus;
  progress_percent: number;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  // Joined fields
  project?: Project;
  site?: Site;
  profile?: Profile;
  automation_slug?: string | null;
}

export interface RunLog {
  id: string;
  run_id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface RunFile {
  id: string;
  run_id: string;
  file_type: string;
  storage_path: string;
  filename: string;
  created_at: string;
}

export interface InputFile {
  id: string;
  filename: string;
  file_type: 'CRAWL' | 'MASTER';
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  subject: string;
  message: string;
  attachment_path: string | null;
  created_at: string;
}
