# Получение OAuth ключей и настройка сервисов

Подробная инструкция по получению всех необходимых ключей для работы приложения.

## 1. Google OAuth (для входа через Google)

### Шаг 1: Создать проект в Google Cloud Console

1. Перейдите на https://console.cloud.google.com/
2. Войдите с вашим Google аккаунтом
3. Нажмите на выпадающий список проектов вверху
4. Нажмите "New Project" (Новый проект)
5. Введите название: `Inventory Management`
6. Нажмите "Create" (Создать)

### Шаг 2: Включить Google+ API

1. В меню слева выберите "APIs & Services" → "Library"
2. Найдите "Google+ API"
3. Нажмите на него и нажмите "Enable" (Включить)

### Шаг 3: Создать OAuth credentials

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth client ID"
3. Если появится предупреждение о consent screen:
   - Нажмите "Configure Consent Screen"
   - Выберите "External" (Внешний)
   - Нажмите "Create"
   - Заполните обязательные поля:
     - App name: `Inventory Management`
     - User support email: ваш email
     - Developer contact: ваш email
   - Нажмите "Save and Continue"
   - На странице "Scopes" нажмите "Save and Continue"
   - На странице "Test users" нажмите "Save and Continue"
4. Вернитесь в "Credentials" → "Create Credentials" → "OAuth client ID"
5. Выберите "Application type": **Web application**
6. Введите название: `Inventory Backend`
7. В разделе "Authorized redirect URIs" добавьте:
   - Для локальной разработки: `http://localhost:3000/auth/google/callback`
   - Для Render.com: `https://ваше-приложение.onrender.com/auth/google/callback`
8. Нажмите "Create"
9. **Скопируйте:**
   - `Client ID` → это ваш `GOOGLE_CLIENT_ID`
   - `Client Secret` → это ваш `GOOGLE_CLIENT_SECRET`

### Пример:
```
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
```

---

## 2. Facebook OAuth (для входа через Facebook)

### Шаг 1: Создать приложение Facebook

1. Перейдите на https://developers.facebook.com/
2. Войдите с вашим Facebook аккаунтом
3. Нажмите "My Apps" (Мои приложения) → "Create App" (Создать приложение)
4. Выберите тип: **Consumer** (Потребительский)
5. Нажмите "Next" (Далее)
6. Заполните форму:
   - App name: `Inventory Management`
   - App contact email: ваш email
7. Нажмите "Create App" (Создать приложение)

### Шаг 2: Добавить Facebook Login

1. В дашборде приложения найдите "Add Products" (Добавить продукты)
2. Найдите "Facebook Login" и нажмите "Set Up" (Настроить)
3. Выберите "Web"
4. Введите URL сайта (можно временно: `http://localhost:3000`)
5. Нажмите "Save" и "Continue"

### Шаг 3: Настроить OAuth Redirect URIs

1. В меню слева выберите "Facebook Login" → "Settings"
2. В поле "Valid OAuth Redirect URIs" добавьте:
   - Для локальной разработки: `http://localhost:3000/auth/facebook/callback`
   - Для Render.com: `https://ваше-приложение.onrender.com/auth/facebook/callback`
3. Нажмите "Save Changes"

### Шаг 4: Получить ключи

1. В меню слева выберите "Settings" → "Basic"
2. **Скопируйте:**
   - `App ID` → это ваш `FACEBOOK_APP_ID`
   - `App Secret` (нажмите "Show") → это ваш `FACEBOOK_APP_SECRET`

### Пример:
```
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
```

---

## 3. AWS S3 (для загрузки файлов)

### Вариант A: AWS S3 (рекомендуется для продакшена)

#### Шаг 1: Создать аккаунт AWS

1. Перейдите на https://aws.amazon.com/
2. Нажмите "Create an AWS Account"
3. Следуйте инструкциям (потребуется кредитная карта, но есть бесплатный tier)

#### Шаг 2: Создать S3 Bucket

1. Войдите в AWS Console: https://console.aws.amazon.com/
2. Найдите "S3" в поиске
3. Нажмите "Create bucket"
4. Заполните:
   - Bucket name: `inventory-files-ваше-имя` (должно быть уникальным)
   - Region: выберите ближайший регион (например, `us-east-1`)
5. Снимите галочку "Block all public access" (если нужен публичный доступ)
6. Нажмите "Create bucket"

#### Шаг 3: Настроить CORS

1. Откройте созданный bucket
2. Перейдите на вкладку "Permissions"
3. Прокрутите до "Cross-origin resource sharing (CORS)"
4. Нажмите "Edit" и вставьте:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

5. Нажмите "Save changes"

#### Шаг 4: Создать IAM пользователя

1. В AWS Console найдите "IAM"
2. Перейдите в "Users" → "Add users"
3. Введите имя: `inventory-backend`
4. Выберите "Access key - Programmatic access"
5. Нажмите "Next: Permissions"
6. Выберите "Attach existing policies directly"
7. Найдите и выберите `AmazonS3FullAccess`
8. Нажмите "Next" → "Create user"
9. **ВАЖНО: Скопируйте ключи (они больше не будут показаны!):**
   - `Access key ID` → это ваш `AWS_ACCESS_KEY_ID`
   - `Secret access key` → это ваш `AWS_SECRET_ACCESS_KEY`

#### Пример для AWS:
```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=inventory-files-ваше-имя
AWS_S3_ENDPOINT=https://s3.amazonaws.com
S3_USE_PATH_STYLE=false
```

### Вариант B: DigitalOcean Spaces (проще и дешевле)

#### Шаг 1: Создать аккаунт DigitalOcean

1. Перейдите на https://www.digitalocean.com/
2. Зарегистрируйтесь (есть $200 кредитов для новых пользователей)

#### Шаг 2: Создать Space

1. В панели управления выберите "Spaces"
2. Нажмите "Create Space"
3. Выберите регион (например, NYC3)
4. Введите имя: `inventory-files`
5. Выберите "Public" или "Private"
6. Нажмите "Create Space"

#### Шаг 3: Получить ключи

1. Перейдите в "API" → "Spaces Keys"
2. Нажмите "Generate New Key"
3. Введите имя: `inventory-backend`
4. **Скопируйте:**
   - `Key` → это ваш `AWS_ACCESS_KEY_ID`
   - `Secret` → это ваш `AWS_SECRET_ACCESS_KEY`

#### Пример для DigitalOcean Spaces:
```
AWS_ACCESS_KEY_ID=DO00ABCDEFGHIJKLMNOP
AWS_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz1234567890ABCD
AWS_REGION=us-east-1
AWS_S3_BUCKET=inventory-files
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_USE_PATH_STYLE=true
```

### Вариант C: MinIO (для локальной разработки)

Если вы используете Docker Compose локально:

```
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=inventory-files
AWS_S3_ENDPOINT=http://localhost:9000
S3_USE_PATH_STYLE=true
```

**Не забудьте:**
1. Запустить MinIO: `docker compose up -d minio`
2. Открыть http://localhost:9001
3. Войти: `minioadmin` / `minioadmin`
4. Создать bucket: `inventory-files`

---

## 4. Другие переменные

### FRONTEND_URL

URL вашего фронтенд приложения. Используется для CORS и редиректов после OAuth.

**Примеры:**
```
# Локальная разработка
FRONTEND_URL=http://localhost:3001

# Продакшен
FRONTEND_URL=https://inventory.yourdomain.com
```

### OAUTH_CALLBACK_URL

URL вашего бэкенда для OAuth колбэков.

**Примеры:**
```
# Локальная разработка
OAUTH_CALLBACK_URL=http://localhost:3000/auth/oauth/callback

# Render.com
OAUTH_CALLBACK_URL=https://your-app.onrender.com/auth/oauth/callback

# Свой домен
OAUTH_CALLBACK_URL=https://api.yourdomain.com/auth/oauth/callback
```

---

## Полный пример .env файла

### Для локальной разработки:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# OAuth - Google
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx"

# OAuth - Facebook
FACEBOOK_APP_ID="1234567890123456"
FACEBOOK_APP_SECRET="abcdef1234567890abcdef1234567890"

# OAuth Callback
OAUTH_CALLBACK_URL="http://localhost:3000/auth/oauth/callback"

# S3 / MinIO (локально)
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="inventory-files"
AWS_S3_ENDPOINT="http://localhost:9000"
S3_USE_PATH_STYLE="true"

# App
PORT=3000
FRONTEND_URL="http://localhost:3001"
```

### Для Render.com:

В Render.com добавьте эти переменные в настройках сервиса:

```env
# JWT (Render автоматически генерирует, если использовать generateValue: true)
JWT_SECRET=<автоматически сгенерируется>
JWT_EXPIRES_IN=7d

# OAuth - Google
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx

# OAuth - Facebook
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890

# OAuth Callback (замените на ваш URL)
OAUTH_CALLBACK_URL=https://your-app.onrender.com/auth/oauth/callback

# S3 (AWS или DigitalOcean)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=inventory-files
AWS_S3_ENDPOINT=https://s3.amazonaws.com
S3_USE_PATH_STYLE=false

# App
PORT=3000
FRONTEND_URL=https://your-frontend.com
NODE_ENV=production
```

---

## Быстрый старт (минимальная конфигурация)

Если вы хотите просто запустить приложение для тестирования, используйте dummy значения:

```env
GOOGLE_CLIENT_ID=dummy
GOOGLE_CLIENT_SECRET=dummy
FACEBOOK_APP_ID=dummy
FACEBOOK_APP_SECRET=dummy
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
AWS_S3_BUCKET=dummy
AWS_S3_ENDPOINT=https://s3.amazonaws.com
FRONTEND_URL=http://localhost:3001
```

**Важно:** С dummy значениями не будут работать:
- ❌ Вход через Google
- ❌ Вход через Facebook
- ❌ Загрузка файлов

Но будут работать:
- ✅ Все REST API endpoints
- ✅ WebSocket (обсуждения)
- ✅ Создание инвентарей и items
- ✅ Поиск и фильтрация
- ✅ Админ панель

---

## Проверка конфигурации

После настройки всех ключей, проверьте:

### 1. Google OAuth
Откройте в браузере:
```
https://your-app.onrender.com/auth/google
```
Должен открыться экран входа Google.

### 2. Facebook OAuth
Откройте в браузере:
```
https://your-app.onrender.com/auth/facebook
```
Должен открыться экран входа Facebook.

### 3. S3 Upload
Используйте endpoint:
```bash
curl -X POST https://your-app.onrender.com/upload \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.pdf","contentType":"application/pdf"}'
```
Должен вернуть presigned URL.

---

## Частые ошибки

### Google OAuth: "redirect_uri_mismatch"
**Решение:** Убедитесь, что URL в Google Console точно совпадает с `OAUTH_CALLBACK_URL`

### Facebook OAuth: "URL Blocked"
**Решение:** Добавьте URL в "Valid OAuth Redirect URIs" в настройках Facebook Login

### S3: "Access Denied"
**Решение:** Проверьте права IAM пользователя или ключи Spaces

### S3: "Bucket not found"
**Решение:** Убедитесь, что bucket создан и имя указано правильно

---

## Безопасность

⚠️ **ВАЖНО:**

1. **Никогда не коммитьте .env файл в Git!**
2. Используйте разные ключи для разработки и продакшена
3. Регулярно меняйте `JWT_SECRET`
4. Ограничьте OAuth redirect URIs только вашими доменами
5. Используйте IAM роли с минимальными правами для S3

---

## Поддержка

Если возникли проблемы:
1. Проверьте логи в Render.com
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что OAuth redirect URIs совпадают
4. Проверьте права доступа к S3 bucket

Удачи! 🚀
