# admin-web

Nuxt 4 + Nitro клиент администратора (UI + BFF в `server/api`).

## Что реализовано
### UI
- admin login/logout
- просмотр пользователей
- просмотр детей выбранного пользователя
- просмотр аудита действий

### Nitro BFF (`/api`)
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/admin/users`
- `GET /api/admin/users/{userId}/children`
- `GET /api/admin/audit/events`

## Запуск
```bash
cd /Users/olegsemenov/Programming/monitoring/admin-web
pnpm install
pnpm dev --port 3001
```

## Требуемые backend
- `auth-service` на `http://localhost:8000`
- `user-children-service` на `http://localhost:8001`

## Доступ
Только токен с ролью `admin`.

## Статус
Подтвержден в e2e smoke (`5/5`): admin-flow, access-control и audit-flow проходят.
