# FileOS

File storage, upload, download, folder management, permissions, versioning, sharing, and S3/R2-backed object management for APPNEURAL.

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

## API Endpoints

- **GET /health** - Health check
- **GET /docs** - API documentation
- **GET /permissions** - List permissions for current role

### File Operations
- **GET /fileos/overview** - Storage overview and statistics
- **GET /fileos/files** - List files
- **POST /fileos/files** - Upload file
- **GET /fileos/files/:id** - Get file details
- **PATCH /fileos/files/:id** - Update file
- **DELETE /fileos/files/:id** - Delete file
- **POST /fileos/files/:id/scan** - Scan file for threats

### Folder Operations
- **GET /fileos/folders** - List folders
- **POST /fileos/folders** - Create folder
- **GET /fileos/folders/:id** - Get folder details
- **PATCH /fileos/folders/:id** - Update folder
- **DELETE /fileos/folders/:id** - Delete folder

### Versioning
- **GET /fileos/files/:id/versions** - List versions
- **POST /fileos/files/:id/versions** - Create version
- **POST /fileos/files/:id/versions/:versionId/restore** - Restore version

### Sharing
- **GET /fileos/files/:id/share-links** - List share links
- **POST /fileos/files/:id/share-links** - Create share link
- **GET /fileos/share/:token** - Access shared file
- **POST /fileos/files/:id/download** - Record download

### Permissions
- **GET /fileos/files/:id/permissions** - List permissions
- **POST /fileos/files/:id/permissions** - Grant permission
- **DELETE /fileos/permissions/:permissionId** - Revoke permission

### Storage
- **GET /fileos/buckets** - List storage buckets
- **POST /fileos/buckets** - Create storage bucket

### Search & Analytics
- **POST /fileos/search** - Search files
- **GET /fileos/files/:id/analytics** - Get file analytics
- **GET /fileos/audit** - Audit logs

## Authentication

Use headers:
- `x-role`: viewer | file_user | file_admin | admin | owner
- `x-tenant-id`: tenant identifier (defaults to demo-tenant)
- `x-user-id`: actor identifier

## Example Usage

```bash
# Get overview
curl http://localhost:6200/fileos/overview

# List files
curl http://localhost:6200/fileos/files

# Create folder
curl -X POST http://localhost:6200/fileos/folders \
  -H "Content-Type: application/json" \
  -d '{"name":"Documents"}'

# Upload file
curl -X POST http://localhost:6200/fileos/files \
  -H "Content-Type: application/json" \
  -d '{
    "name":"resume.pdf",
    "size":822000,
    "mimeType":"application/pdf",
    "tags":["resume","pdf"]
  }'
```

## Configuration

Environment variables:
- `PORT`: Server port (default: 6200)
- `FILEOS_DB_FILE`: Database file path (default: data/fileos.db.json)
- `DEFAULT_TENANT_ID`: Default tenant ID (default: demo-tenant)

## Storage Providers

- **local**: Local filesystem
- **s3**: Amazon Web Services S3
- **r2**: Cloudflare R2
- **azure**: Microsoft Azure Blob Storage
- **gcs**: Google Cloud Storage
- **minio**: MinIO compatible storage

## Permissions

### Viewer
- file.read
- file.preview

### File User
- file.read
- file.preview
- file.upload
- file.download
- file.share
- file.update
- file.scan

### File Admin
- All file_user permissions plus:
- file.delete
- file.archive
- file.restore
- file.manage_permissions
- file.audit.read

### Admin/Owner
- All permissions (*)
## Related OSs

- platformos
- securityos
