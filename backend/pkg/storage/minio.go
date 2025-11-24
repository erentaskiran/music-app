package storage

import (
	"context"
	"fmt"
	"io"
	"music-app/backend/pkg/config"
	"path/filepath"

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
