# 🍇 Grapevine

A music social network inspired by Letterboxd - discover, review, and share music with friends.

## 🎵 Overview

Grapevine is a modern music discovery and social platform where users can:
- **Review songs** with ratings and captions
- **Curate playlists** with custom collections
- **Follow friends** and see what they're listening to
- **Discover new music** through a social feed
- **Create a Top 4** of favorite obsessions on your profile

Built as a progressive web app (PWA) optimized for mobile, with a sleek UI inspired by modern streaming services.

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **APIs**: 
  - iTunes Search API (music metadata)
  - Last.fm API (song descriptions)
  - SoundCloud oEmbed (SoundCloud link support)
- **Deployment**: Vercel
- **Icons**: Lucide React

## 📁 Project Structure

```
grapevine-app/
├── api/                      # Serverless API functions
│   └── search.js            # Proxy for iTunes API + SoundCloud
├── public/                   # Static assets
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
├── src/
│   ├── components/          # React components
│   │   ├── AddToPlaylistModal.jsx
│   │   ├── AuthScreen.jsx
│   │   ├── CommentSection.jsx
│   │   ├── GlobalSearchView.jsx
│   │   ├── PlaylistDetailView.jsx
│   │   ├── PlaylistsView.jsx
│   │   ├── PosterCard.jsx
│   │   ├── ProfileView.jsx
│   │   ├── SearchModal.jsx
│   │   ├── SongDetailView.jsx
│   │   └── Toast.jsx
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # App entry point
│   ├── index.css            # Global styles
│   └── supabaseClient.js    # Supabase configuration
├── schema.sql               # Initial database schema
├── schema_v2.sql            # Extended schema (playlists, follows, likes)
├── complete_setup.sql       # Full schema with profiles
└── package.json             # Dependencies

```

## 🗄 Database Schema

### Core Tables

**posts** - User reviews/ratings
- `id`, `user_id`, `user_name`, `song_name`, `artist_name`, `album_art_url`
- `rating` (1-5), `caption`, `spotify_id`, `soundcloud_url`, `preview_url`

**playlists** - User-created collections
- `id`, `user_id`, `title`, `description`, `is_public`

**playlist_items** - Songs within playlists
- `id`, `playlist_id`, `song_name`, `artist_name`, `album_art_url`, `preview_url`

**user_favorites** - Top 4 obsessions
- `user_id`, `slot_number` (0-3), `track_name`, `artist_name`, `image_url`

**profiles** - Extended user profiles
- `id`, `user_name`, `avatar_url`, `bio`

**follows** - Social graph
- `follower_id`, `following_id`

**post_likes** - Like system
- `user_id`, `post_id`

**comments** - Comments on posts
- `post_id`, `user_id`, `content`, `rating`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/alexanderkelham-droid/grapevine-app.git
cd grapevine-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
   - Run `complete_setup.sql` in your Supabase SQL editor
   - Enable Row Level Security policies as needed

5. Start the development server:
```bash
npm run dev
```

### Deployment

The app is configured for Vercel deployment:

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy! The `/api` folder is automatically handled as serverless functions

## 🎨 Key Features

### 🎵 Song Reviews
- Search for songs via iTunes API
- Rate songs 1-5 stars with captions
- View aggregate ratings and reviews from all users
- Listen to 30-second previews

### 📚 Playlists
- Create custom collections
- Add songs from search or reviews
- Visual grid covers (up to 4 album arts)
- Drag to reorder (coming soon)

### 👥 Social Features
- Follow/unfollow users
- View friend activity feed
- Comment on reviews
- Like posts

### 🌟 Profile Customization
- Set a "Top 4" of favorite songs
- Custom avatar and username
- View all your reviews and playlists
- Public profile pages

### 🔍 Global Search
- Search for songs, artists, or albums
- Search for other users
- Filter by people or tracks

### 🎧 Music Platform Integration
- Direct links to Apple Music
- Spotify search links (mobile deep-linking)
- SoundCloud support via URL pasting

## 🎯 Roadmap

- [ ] Enhanced recommendations algorithm
- [ ] Playlist sharing and collaboration
- [ ] Artist profiles and analytics
- [ ] Push notifications for new followers
- [ ] Export playlists to Spotify/Apple Music
- [ ] Dark/light theme toggle
- [ ] Activity feed with filters

## 🐛 Known Issues

- Preview playback doesn't work for all songs (iTunes API limitation)
- SoundCloud links require API proxy to avoid CORS

## 📝 Notes

- The Last.fm API key is hardcoded in `SongDetailView.jsx` - replace with your own
- Blocklist for certain usernames is applied in `fetchPosts()` to filter spam
- Sample data is shown when Supabase is unavailable

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

MIT License - feel free to use this project as inspiration for your own music app.

## 🙏 Acknowledgments

- Inspired by [Letterboxd](https://letterboxd.com/)
- UI design influenced by modern streaming platforms
- Built with love for music discovery 🎶

---

**Live Demo**: [grapevine-app.vercel.app](https://grapevine-app.vercel.app)  
**GitHub**: [alexanderkelham-droid/grapevine-app](https://github.com/alexanderkelham-droid/grapevine-app)
