CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "username" VARCHAR(100) NOT NULL,
  "avatar_url" TEXT,
  "role" VARCHAR(20) DEFAULT 'user',
  "created_at" TIMESTAMP DEFAULT (NOW()),
  "updated_at" TIMESTAMP DEFAULT (NOW())
);

CREATE TABLE "tracks" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "artist_id" INT NOT NULL,
  "file_url" TEXT NOT NULL,
  "duration" INT,
  "cover_image_url" TEXT,
  "genre" VARCHAR(50),
  "lyrics" TEXT,
  "quality_bitrate" INT,
  "status" VARCHAR(30) DEFAULT 'published',
  "created_at" TIMESTAMP DEFAULT (NOW()),
  "updated_at" TIMESTAMP DEFAULT (NOW())
);

CREATE TABLE "albums" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "artist_id" INT NOT NULL,
  "cover_url" TEXT,
  "release_date" DATE,
  "created_at" TIMESTAMP DEFAULT (NOW())
);

CREATE TABLE "tags" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE "track_tags" (
  "id" SERIAL PRIMARY KEY,
  "track_id" INT NOT NULL,
  "tag_id" INT NOT NULL
);

CREATE TABLE "playlists" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "creator_id" INT NOT NULL,
  "cover_url" TEXT,
  "privacy" VARCHAR(20) DEFAULT 'public',
  "created_at" TIMESTAMP DEFAULT (NOW())
);

CREATE TABLE "playlist_tracks" (
  "id" SERIAL PRIMARY KEY,
  "playlist_id" INT NOT NULL,
  "track_id" INT NOT NULL
);

CREATE TABLE "listens" (
  "id" SERIAL PRIMARY KEY,
  "track_id" INT NOT NULL,
  "user_id" INT,
  "device" VARCHAR(100),
  "ip" INET,
  "listen_duration" INT,
  "timestamp" TIMESTAMP DEFAULT (NOW())
);

CREATE TABLE "likes" (
  "id" SERIAL PRIMARY KEY,
  "track_id" INT NOT NULL,
  "user_id" INT NOT NULL,
  "created_at" TIMESTAMP DEFAULT (NOW())
);

CREATE TABLE "comments" (
  "id" SERIAL PRIMARY KEY,
  "track_id" INT NOT NULL,
  "user_id" INT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT (NOW())
);

CREATE TABLE "admin_logs" (
  "id" SERIAL PRIMARY KEY,
  "action" VARCHAR(255) NOT NULL,
  "actor_id" INT NOT NULL,
  "target_id" INT,
  "timestamp" TIMESTAMP DEFAULT (NOW())
);

CREATE UNIQUE INDEX ON "playlist_tracks" ("playlist_id", "track_id");

CREATE UNIQUE INDEX ON "likes" ("track_id", "user_id");

ALTER TABLE "tracks" ADD FOREIGN KEY ("artist_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "albums" ADD FOREIGN KEY ("artist_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "track_tags" ADD FOREIGN KEY ("track_id") REFERENCES "tracks" ("id") ON DELETE CASCADE;

ALTER TABLE "track_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE;

ALTER TABLE "playlists" ADD FOREIGN KEY ("creator_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "playlist_tracks" ADD FOREIGN KEY ("playlist_id") REFERENCES "playlists" ("id") ON DELETE CASCADE;

ALTER TABLE "playlist_tracks" ADD FOREIGN KEY ("track_id") REFERENCES "tracks" ("id") ON DELETE CASCADE;

ALTER TABLE "listens" ADD FOREIGN KEY ("track_id") REFERENCES "tracks" ("id") ON DELETE CASCADE;

ALTER TABLE "listens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;

ALTER TABLE "likes" ADD FOREIGN KEY ("track_id") REFERENCES "tracks" ("id") ON DELETE CASCADE;

ALTER TABLE "likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD FOREIGN KEY ("track_id") REFERENCES "tracks" ("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "admin_logs" ADD FOREIGN KEY ("actor_id") REFERENCES "users" ("id") ON DELETE CASCADE;
