package storage

import (
	"context"
	"fmt"
	"io"
	"music-app/backend/pkg/config"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioClient struct {
	Client     *minio.Client
	BucketName string
	Endpoint   string
	UseSSL     bool
}

func NewMinioClient(cfg *config.Config) (*MinioClient, error) {
	minioClient, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure: cfg.MinioUseSSL,
	})
	if err != nil {
		return nil, err
	}

	// Check if bucket exists, create if not
	ctx := context.Background()
	exists, err := minioClient.BucketExists(ctx, cfg.MinioBucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		err = minioClient.MakeBucket(ctx, cfg.MinioBucketName, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	// Set public bucket policy
	policy := fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Principal": {"AWS": ["*"]},
				"Action": ["s3:GetObject"],
				"Resource": ["arn:aws:s3:::%s/*"]
			}
		]
	}`, cfg.MinioBucketName)

	err = minioClient.SetBucketPolicy(ctx, cfg.MinioBucketName, policy)
	if err != nil {
		return nil, fmt.Errorf("failed to set bucket policy: %w", err)
	}

	return &MinioClient{
		Client:     minioClient,
		BucketName: cfg.MinioBucketName,
		Endpoint:   cfg.MinioEndpoint,
		UseSSL:     cfg.MinioUseSSL,
	}, nil
}

func (m *MinioClient) UploadFile(ctx context.Context, fileReader interface{}, fileSize int64, contentType, originalName string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(originalName)
	newFileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	// Upload the file
	reader, ok := fileReader.(io.Reader)
	if !ok || reader == nil {
		return "", fmt.Errorf("invalid file reader")
	}

	info, err := m.Client.PutObject(ctx, m.BucketName, newFileName, reader, fileSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload object to MinIO bucket %s: %w", m.BucketName, err)
	}

	// Construct URL
	protocol := "http"
	if m.UseSSL {
		protocol = "https"
	}

	url := fmt.Sprintf("%s://%s/%s/%s", protocol, m.Endpoint, m.BucketName, info.Key)
	return url, nil
}

// GetObject retrieves an object from MinIO with optional range support for streaming
func (m *MinioClient) GetObject(ctx context.Context, objectName string, opts minio.GetObjectOptions) (*minio.Object, error) {
	obj, err := m.Client.GetObject(ctx, m.BucketName, objectName, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to get object from MinIO: %w", err)
	}
	return obj, nil
}

// GetObjectInfo retrieves object information (size, content type, etc.)
func (m *MinioClient) GetObjectInfo(ctx context.Context, objectName string) (minio.ObjectInfo, error) {
	info, err := m.Client.StatObject(ctx, m.BucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		return minio.ObjectInfo{}, fmt.Errorf("failed to get object info from MinIO: %w", err)
	}
	return info, nil
}

// ExtractObjectName extracts the object name from a full MinIO URL
func (m *MinioClient) ExtractObjectName(fileURL string) string {
	// URL format: http(s)://endpoint/bucket/objectname
	prefix := fmt.Sprintf("http://%s/%s/", m.Endpoint, m.BucketName)
	if m.UseSSL {
		prefix = fmt.Sprintf("https://%s/%s/", m.Endpoint, m.BucketName)
	}
	return strings.TrimPrefix(fileURL, prefix)
}

// DeleteFile deletes a file from MinIO storage
func (m *MinioClient) DeleteFile(ctx context.Context, objectName string) error {
	err := m.Client.RemoveObject(ctx, m.BucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete object from MinIO: %w", err)
	}
	return nil
}
