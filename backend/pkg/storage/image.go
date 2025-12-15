package storage

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"strings"
)

// CropToSquare crops an image to a square format, centering on the image
// It maintains the aspect ratio and crops the larger dimension
func CropToSquare(reader io.Reader, contentType string) (io.Reader, string, error) {
	// Decode the image
	var img image.Image
	var err error
	var format string

	contentTypeLower := strings.ToLower(contentType)

	if strings.Contains(contentTypeLower, "jpeg") || strings.Contains(contentTypeLower, "jpg") {
		img, err = jpeg.Decode(reader)
		format = "jpeg"
	} else if strings.Contains(contentTypeLower, "png") {
		img, err = png.Decode(reader)
		format = "png"
	} else {
		return nil, "", fmt.Errorf("unsupported image format: %s", contentType)
	}

	if err != nil {
		return nil, "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Get image bounds
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Determine the size of the square (use the smaller dimension)
	squareSize := width
	if height < width {
		squareSize = height
	}

	// Calculate the offset to center the crop
	offsetX := (width - squareSize) / 2
	offsetY := (height - squareSize) / 2

	// Create a new image with square dimensions
	srcImage := image.NewRGBA(image.Rect(0, 0, squareSize, squareSize))
	for y := 0; y < squareSize; y++ {
		for x := 0; x < squareSize; x++ {
			srcImage.Set(x, y, img.At(offsetX+x, offsetY+y))
		}
	}

	// Encode back to the original format
	var buf bytes.Buffer
	var encodeErr error

	if format == "jpeg" {
		encodeErr = jpeg.Encode(&buf, srcImage, &jpeg.Options{Quality: 90})
	} else if format == "png" {
		encodeErr = png.Encode(&buf, srcImage)
	}

	if encodeErr != nil {
		return nil, "", fmt.Errorf("failed to encode image: %w", encodeErr)
	}

	return bytes.NewReader(buf.Bytes()), contentType, nil
}
