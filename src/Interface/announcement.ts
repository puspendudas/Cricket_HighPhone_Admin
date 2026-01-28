export interface Announcement {
  message: any;
  id: string;
  title: string;
  body: string;
  status: string; 
  user_type: string;
  match_id?: string | null;
  dateTime: string;
  recipient: string;
  match: string;
}
export interface CreateAnnouncementData {
  title: string;
  body: string;
  status: string;
  user_type: string;
  match_id?: string | null;
}
export interface UpdateAnnouncementData {
  id: string;
  team?: string;
  match?: string;
  message?: string;
  status?: 'true' | 'false';
}

// API payload interfaces based on your structure
export interface CreateAnnouncementApiData {
  title: string;
  body: string;
  user_type: string;
  match_id: string;
  status: string;
}
