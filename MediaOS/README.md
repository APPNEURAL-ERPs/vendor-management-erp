# MediaOS

MediaOS is the media asset management and processing layer for APPNEURAL platforms.

## Features

- **Media Asset Management**: Upload, store, and organize images, videos, and audio files
- **Media Libraries**: Organize assets by purpose (brand, course, social, product)
- **Thumbnail Generation**: Auto-generate preview images from video and audio content
- **Media Transcoding**: Convert media formats (video, audio, images)
- **Media Processing Jobs**: Queue and manage processing tasks
- **Renditions**: Create multiple versions of media assets (different sizes, formats)
- **Analytics**: Track views, downloads, and shares
- **Audit Logging**: Complete audit trail of all operations

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start

# Server runs on http://localhost:6300
```

## API Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /docs` - API documentation

### Media Overview
- `GET /mediaos/overview` - Get overview stats

### Libraries
- `GET /mediaos/libraries` - List all libraries
- `POST /mediaos/libraries` - Create a library

### Assets
- `GET /mediaos/assets` - List assets (supports ?search=, ?type=, ?libraryId=)
- `POST /mediaos/assets` - Create/upload asset
- `GET /mediaos/assets/:id` - Get asset details
- `PATCH /mediaos/assets/:id` - Update asset
- `DELETE /mediaos/assets/:id` - Delete asset

### Thumbnails
- `GET /mediaos/assets/:id/thumbnails` - List thumbnails for asset
- `POST /mediaos/assets/:id/thumbnail` - Generate thumbnail

### Renditions
- `GET /mediaos/assets/:id/renditions` - List renditions
- `POST /mediaos/assets/:id/renditions` - Create rendition

### Processing Jobs
- `GET /mediaos/jobs` - List jobs (supports ?status=, ?type=, ?assetId=)
- `POST /mediaos/jobs` - Create job
- `PATCH /mediaos/jobs/:id` - Update job status

### Folders
- `GET /mediaos/folders` - List folders
- `POST /mediaos/folders` - Create folder

### Analytics
- `GET /mediaos/assets/:id/analytics` - Record view/download
- `POST /mediaos/assets/:id/analytics` - Record analytics event

### Events & Audit
- `GET /mediaos/events` - List events
- `GET /mediaos/audit` - List audit logs

## Authentication

All endpoints require headers:
- `x-role`: Role (owner, admin, media_admin, media_manager, content_creator, viewer)
- `x-tenant-id`: Tenant ID (defaults to demo-tenant)
- `x-user-id`: User ID

## Example Usage

```bash
# Health check
curl http://localhost:6300/health

# Get overview
curl -H "x-role: admin" http://localhost:6300/mediaos/overview

# List assets
curl -H "x-role: media_manager" http://localhost:6300/mediaos/assets

# Create asset
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-role: media_manager" \
  -d '{
    "key": "my-image",
    "name": "My Image",
    "type": "image",
    "format": "png",
    "url": "https://example.com/image.png",
    "category": "brand",
    "tags": ["logo", "brand"]
  }' \
  http://localhost:6300/mediaos/assets

# Generate thumbnail
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-role: media_manager" \
  -d '{"width": 320, "height": 180}' \
  http://localhost:6300/mediaos/assets/asset_logo_primary/thumbnail

# List processing jobs
curl -H "x-role: admin" "http://localhost:6300/mediaos/jobs?status=queued"
```

## Media Types

Supported media types:
- `image`: PNG, JPG, JPEG, WebP, GIF, SVG
- `video`: MP4, MOV, WebM
- `audio`: MP3, WAV, M4A
- `document`: PDF
- `other`: Any other type

## Processing Job Types

- `thumbnail`: Generate preview/thumbnail
- `transcode`: Convert format
- `compress`: Compress file
- `caption`: Generate captions
- `watermark`: Add watermark
- `optimize`: Optimize for web
- `resize`: Resize image/video
- `extract_metadata`: Extract metadata

## Architecture

MediaOS follows a modular architecture:

```
MediaOS
├── src/
│   ├── core/           # Core utilities (datastore, http, id, utils)
│   ├── modules/        # Route definitions
│   ├── services/       # Business logic
│   ├── types.ts        # Type definitions
│   ├── docs.ts         # API documentation
│   ├── seed-state.ts   # Demo data
│   └── main.ts         # Entry point
├── data/               # JSON database storage
└── dist/               # Compiled output
```

## Status

- **Port**: 6300 (configurable via PORT env var)
- **Database**: JSON file (configurable via MEDIAOS_DB_FILE env var)
- **Status**: Active

## License

MIT
## Related OSs

- platformos
- securityos
