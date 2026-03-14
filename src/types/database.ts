export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  social_links: Json | null
  created_at: string
  updated_at: string
}

export interface Clip {
  id: string
  user_id: string
  source_type: 'youtube' | 'upload'
  url_or_path: string
  start_sec: number | null
  end_sec: number | null
  thumbnail: string | null
  title: string | null
  created_at: string
}

export interface Reel {
  id: string
  user_id: string
  title: string
  clip_ids: string[]
  combined_video_url: string | null
  thumbnail: string | null
  created_at: string
}

export interface Match {
  id: string
  name: string
  description: string | null
  reel_ids: string[]
  live_stream_url: string | null
  created_at: string
}

export interface LiveStream {
  id: string
  user_id: string
  youtube_url: string
  title: string | null
  match_id: string | null
  is_live: boolean
  created_at: string
}

export interface LiveGroup {
  id: string
  name: string
  creator_id: string | null
  created_at: string
}

export interface LiveGroupMember {
  id: string
  group_id: string
  user_id: string
  stream_id: string | null
  accepted: boolean
}

export interface UserYoutubeLink {
  id: string
  user_id: string
  url: string
  title: string | null
  created_at: string
}

export interface Server {
  id: string
  name: string
  clan_tag: string | null
  icon_url: string | null
  join_mode?: 'open' | 'apply' | 'invite'
  criteria?: Record<string, unknown> | null
  owner_id?: string | null
  ultra_tier_expires_at?: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier: 'pro' | 'elite'
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string | null
  created_at: string
}

export interface ClanSubscription {
  id: string
  server_id: string
  stripe_subscription_id: string | null
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string | null
  created_at: string
}

export interface ServerApplication {
  id: string
  server_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  message: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Channel {
  id: string
  server_id: string
  name: string
  type: 'text' | 'clips'
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  user_id: string
  content: string
  clip_id: string | null
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
}

export interface PostAttachment {
  id: string
  post_id: string
  type: 'image' | 'reel'
  url_or_id: string
  sort_order: number
  created_at: string
}

export interface PostPoll {
  id: string
  post_id: string
  question: string
  ends_at: string | null
  created_at: string
}

export interface PostPollOption {
  id: string
  poll_id: string
  label: string
  sort_order: number
  created_at: string
}

export interface PostPollVote {
  id: string
  option_id: string
  user_id: string
  created_at: string
}
