package repository

import (
	"math"
	"music-app/backend/internal/models"
)

func (r *Repository) GetAdminDashboardStats() (models.AdminDashboardStats, error) {
	stats := models.AdminDashboardStats{}

	if err := r.Db.QueryRow(`SELECT COUNT(*) FROM tracks`).Scan(&stats.TotalTracks); err != nil {
		return stats, err
	}

	var uploadsCurrent int
	if err := r.Db.QueryRow(
		`SELECT COUNT(*) FROM tracks WHERE created_at >= NOW() - INTERVAL '30 days'`,
	).Scan(&uploadsCurrent); err != nil {
		return stats, err
	}

	var uploadsPrevious int
	if err := r.Db.QueryRow(
		`SELECT COUNT(*) FROM tracks WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'`,
	).Scan(&uploadsPrevious); err != nil {
		return stats, err
	}

	stats.TotalUploads = uploadsCurrent
	stats.TotalUploadsChange = roundPercentChange(uploadsCurrent, uploadsPrevious)
	stats.TotalTracksChange = roundPercentChange(uploadsCurrent, uploadsPrevious)

	var activeUsersCurrent int
	if err := r.Db.QueryRow(
		`SELECT COUNT(DISTINCT user_id) FROM listens WHERE user_id IS NOT NULL AND timestamp >= NOW() - INTERVAL '30 days'`,
	).Scan(&activeUsersCurrent); err != nil {
		return stats, err
	}

	var activeUsersPrevious int
	if err := r.Db.QueryRow(
		`SELECT COUNT(DISTINCT user_id) FROM listens WHERE user_id IS NOT NULL AND timestamp >= NOW() - INTERVAL '60 days' AND timestamp < NOW() - INTERVAL '30 days'`,
	).Scan(&activeUsersPrevious); err != nil {
		return stats, err
	}

	stats.ActiveUsers = activeUsersCurrent
	stats.ActiveUsersChange = roundPercentChange(activeUsersCurrent, activeUsersPrevious)

	var streamsToday int
	if err := r.Db.QueryRow(
		`SELECT COUNT(*) FROM listens WHERE timestamp >= CURRENT_DATE AND timestamp < CURRENT_DATE + INTERVAL '1 day'`,
	).Scan(&streamsToday); err != nil {
		return stats, err
	}

	var streamsYesterday int
	if err := r.Db.QueryRow(
		`SELECT COUNT(*) FROM listens WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day' AND timestamp < CURRENT_DATE`,
	).Scan(&streamsYesterday); err != nil {
		return stats, err
	}

	stats.StreamsToday = streamsToday
	stats.StreamsTodayChange = roundPercentChange(streamsToday, streamsYesterday)

	return stats, nil
}

func (r *Repository) GetRecentUploads(limit int) ([]models.AdminRecentUpload, error) {
	if limit <= 0 {
		limit = 5
	}

	rows, err := r.Db.Query(
		`SELECT t.id, t.title, COALESCE(u.username, 'Unknown Artist') as artist_name, t.created_at
		FROM tracks t
		LEFT JOIN users u ON t.artist_id = u.id
		ORDER BY t.created_at DESC
		LIMIT $1`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	uploads := []models.AdminRecentUpload{}
	for rows.Next() {
		var upload models.AdminRecentUpload
		if err := rows.Scan(&upload.ID, &upload.Title, &upload.ArtistName, &upload.CreatedAt); err != nil {
			return nil, err
		}
		uploads = append(uploads, upload)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return uploads, nil
}

func roundPercentChange(current, previous int) float64 {
	if previous == 0 {
		if current == 0 {
			return 0
		}
		return 100
	}

	change := (float64(current) - float64(previous)) / float64(previous) * 100
	return math.Round(change*10) / 10
}
