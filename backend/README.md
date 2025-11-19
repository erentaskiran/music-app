# Backend — Music App (Go)

Bu klasör Go ile yazılmış backend servisini içerir. Aşağıdaki adımlar macOS (zsh) için hazırlanmıştır.

**Gereksinimler**
- `Go` (repo `go.mod` dosyasına göre `go 1.25+` önerilir)
- `PostgreSQL` (veritabanı)
- `psql` komutu

**1) Go yükleme (Homebrew kullanıyorsanız)**
```
brew update
brew install go
```

Doğrulama:
```
go version
```

**2) PostgreSQL yükleme ve başlatma (Homebrew)**
```
brew install postgresql
brew services start postgresql
```

**3) Ortam değişkenleri**
Kökte örnek `backend/.env.example` dosyası bulunmaktadır. Kopyalayın ve değerleri düzenleyin:
```
cp backend/.env.example backend/.env
# edit backend/.env
```

Örnek (mevcut `.env` içinde projede):
```
DATABASE_URL=postgres://music:password@localhost:5432/music?sslmode=disable
PORT=8000
JWT_SECRET=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Önemli:** `JWT_SECRET` güvenlik için mutlaka değiştirilmelidir ve production ortamında uzun, rastgele bir değer kullanılmalıdır.

**4) Veritabanı oluşturma ve şema yükleme**
Varsayılan olarak proje `backend/db.sql` içerir. Örnek komutlar:
```
# postgres süper kullanıcı ile giriş (macOS brew kurulumu genelde 'postgres' kullanır)
psql -U postgres -c "CREATE USER music WITH PASSWORD 'password';"
psql -U postgres -c "CREATE DATABASE music;"
psql -U music -d music -f backend/db.sql
```

Eğer `psql -U postgres` bağlanamazsanız, yerel Postgres için şu komutları deneyin:
```
createuser $(whoami) --superuser
createdb $(whoami)
# veya psql içinde SQL çalıştırmak
```

**5) Bağımlılıkları indirme ve çalıştırma (geliştirme)**
```
cd backend
go mod download
go run ./cmd/server
```

Varsa özel port kullanımı:
```
PORT=8000 DATABASE_URL="postgres://..." go run ./cmd/server
```

**6) Derleme (production)**
```
cd backend
go build -o bin/server ./cmd/server
./bin/server
```

**7) API Endpoints**

**Public Endpoints (Kimlik doğrulama gerektirmez):**
- `GET /api/health` - Sunucu sağlık kontrolü
- `POST /api/register` - Yeni kullanıcı kaydı
  ```json
  {
    "name": "string",
    "mail": "string",
    "password": "string"
  }
  ```
- `POST /api/login` - Kullanıcı girişi (access + refresh token döner)
  ```json
  {
    "mail": "string",
    "password": "string"
  }
  ```
- `POST /api/refresh` - Token yenileme
  ```json
  {
    "refresh_token": "string"
  }
  ```
- `POST /api/logout` - Kullanıcı çıkışı

**Protected Endpoints (Authorization: Bearer {token} gerektirir):**
- `GET /api/me` - Giriş yapmış kullanıcı bilgisi

**8) Yardımcı notlar / troubleshooting**
- Eğer DB bağlantı hatası alırsanız, `DATABASE_URL` içindeki kullanıcı/şifre/db adını kontrol edin.
- `log.Fatalf("Failed to connect to TimescaleDB: %s", err)` gibi hata mesajları `pkg/db/db.go` içinden gelir — Postgres sürücü (`github.com/lib/pq`) kullanılıyor.
- Token hatası alırsanız, `.env` dosyasında `JWT_SECRET` tanımlı olduğundan emin olun.
- CORS hatası alırsanız, frontend URL'inizi `middleware/cors.go` içinde yapılandırabilirsiniz.
