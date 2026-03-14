/**
 * Post-stream stitch and YouTube upload.
 * Run on PC: tsx scripts/post-stream-stitch.ts <group_id>
 * Requires: yt-dlp, ffmpeg, YouTube API credentials.
 * Downloads segments from YouTube per live_stream_switch_log timeline,
 * concatenates with FFmpeg, uploads to SmashHub YouTube channel.
 *
 * Setup: Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN.
 */

const groupId = process.argv[2];
if (!groupId) {
  console.error('Usage: tsx scripts/post-stream-stitch.ts <group_id>');
  process.exit(1);
}

console.log('Post-stream stitch: run yt-dlp and ffmpeg manually, or implement full pipeline.');
console.log('Group ID:', groupId);
