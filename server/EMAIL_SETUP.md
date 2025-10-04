# 📧 Email Setup Guide

## Быстрый старт

1. **Откройте админку**: http://localhost:3000/admin
2. **Перейдите в**: Settings → Email Settings
3. **Выберите провайдера** (Gmail, SendGrid, Mailgun, или Custom)
4. **Следуйте инструкциям** во вкладке "Setup Instructions"
5. **Включите отправку**: Enable Email Sending = ON
6. **Протестируйте**: вкладка "Test Email"

---

## 📨 Рекомендуемые провайдеры

### 1. Gmail (для разработки)

**Плюсы:**
- ✅ Бесплатно
- ✅ Быстрая настройка
- ✅ Не требует DNS

**Минусы:**
- ❌ Лимит: 500 emails/день
- ❌ Требует App Password (2FA)

**Когда использовать:** Локальная разработка, тестирование

---

### 2. SendGrid (РЕКОМЕНДУЕТСЯ для production)

**Плюсы:**
- ✅ Бесплатно: 100 emails/день
- ✅ Надежная доставка
- ✅ Аналитика и отслеживание
- ✅ API интеграция

**Минусы:**
- ⚠️ Требует верификацию домена для production

**Когда использовать:** Production сайт

**Настройка для phe.tue.nl:**
1. Зарегистрируйтесь на SendGrid
2. Verify domain: phe.tue.nl
3. Добавьте DNS записи (TXT, CNAME)
4. Создайте API ключ
5. From Email: noreply@phe.tue.nl

---

### 3. Mailgun

**Плюсы:**
- ✅ Бесплатно: 5,000 emails/месяц (первые 3 месяца)
- ✅ Хорошая доставляемость
- ✅ API и SMTP

**Минусы:**
- ⚠️ Требует DNS настройки
- ⚠️ Требует карту для активации

**Когда использовать:** Альтернатива SendGrid

---

## 🔧 Пошаговая настройка

### Вариант 1: Gmail (Разработка)

#### Шаг 1: Включите 2FA
1. Откройте: https://myaccount.google.com/security
2. Включите "2-Step Verification"

#### Шаг 2: Создайте App Password
1. Откройте: https://myaccount.google.com/apppasswords
2. App: "Other (Custom name)" → "PhE Website"
3. Нажмите "Generate"
4. Скопируйте пароль (формат: xxxx xxxx xxxx xxxx)

#### Шаг 3: Настройте в админке
```
Provider: Gmail
Gmail Address: your-email@gmail.com
App Password: xxxx xxxx xxxx xxxx
From Name: PhE Team
Enable Email Sending: ON
```

---

### Вариант 2: SendGrid (Production)

#### Шаг 1: Создайте аккаунт
1. Зарегистрируйтесь: https://signup.sendgrid.com
2. Подтвердите email

#### Шаг 2: Verify Sender
Для домена phe.tue.nl:

1. Перейдите: Settings → Sender Authentication → Verify a Domain
2. Выберите "phe.tue.nl"
3. Добавьте DNS записи (предоставлены SendGrid):

```dns
Type: TXT
Host: em1234.phe.tue.nl
Value: v=spf1 include:sendgrid.net ~all

Type: CNAME
Host: s1._domainkey.phe.tue.nl
Value: s1.domainkey.u1234567.wl.sendgrid.net

Type: CNAME
Host: s2._domainkey.phe.tue.nl
Value: s2.domainkey.u1234567.wl.sendgrid.net
```

4. Дождитесь верификации (до 48 часов)

#### Шаг 3: Создайте API ключ
1. Settings → API Keys → Create API Key
2. Name: "PhE Website"
3. Permissions: "Full Access" или "Mail Send"
4. Скопируйте ключ (начинается с SG.)

#### Шаг 4: Настройте в админке
```
Provider: SendGrid
API Key: SG.xxxxxxxxxxxxxxxxxx
From Email: noreply@phe.tue.nl
From Name: PhE Team
Enable Email Sending: ON
```

---

## 🧪 Тестирование

1. Откройте: Settings → Email Settings → Test Email
2. Введите ваш email адрес
3. Нажмите "Save" (сохраните настройки!)
4. Нажмите "Send Test Email"
5. Проверьте inbox (и spam папку)

✅ Если письмо пришло → настройка работает!
❌ Если нет → проверьте консоль браузера и server logs

---

## 📋 Использование в админке

### Contact Submissions

1. Перейдите: Forms → Contact Submissions
2. Откройте заявку
3. Заполните "Reply Email":
   ```
   Subject: Re: Your inquiry
   Body: Dear {{name}},
   
   Thank you for contacting us...
   ```
4. Нажмите Save → email отправится автоматически

### Join Submissions

1. Перейдите: Forms → Join Submissions
2. Откройте заявку
3. Измените Status на "Accepted" или "Rejected"
4. Отредактируйте email шаблон (опционально)
5. Нажмите Save → email отправится

---

## 🔐 Безопасность

### ⚠️ ВАЖНО:

1. **НЕ коммитьте** API ключи в git
2. **Используйте .env** для локальной разработки
3. **Используйте админку** для production настроек
4. **Храните .env в .gitignore**

### Проверка .gitignore:
```bash
# Должно быть в .gitignore:
.env
.env.local
.env.production
```

---

## 🐛 Troubleshooting

### Проблема: "Failed to send email"

**Решения:**
1. Проверьте, что "Enable Email Sending" = ON
2. Проверьте API ключ / App Password
3. Для Gmail: убедитесь, что используете App Password (не обычный пароль)
4. Для SendGrid: убедитесь, что домен verified
5. Проверьте server logs: `pnpm dev`

### Проблема: Emails в spam

**Решения:**
1. Используйте verified домен (SendGrid/Mailgun)
2. Добавьте SPF и DKIM записи в DNS
3. Используйте профессиональный From Email (не Gmail)

### Проблема: "Authentication failed"

**Gmail:**
- Убедитесь, что 2FA включен
- Используете App Password, а не обычный пароль

**SendGrid:**
- Проверьте API ключ (начинается с SG.)
- Убедитесь, что ключ имеет права Mail Send

---

## 🚀 Production Checklist

Перед деплоем на production:

- [ ] Выбран профессиональный провайдер (SendGrid/Mailgun)
- [ ] Домен verified
- [ ] DNS записи добавлены (SPF, DKIM)
- [ ] API ключи в безопасности (не в git)
- [ ] Тестовый email отправлен успешно
- [ ] From Email = профессиональный (noreply@phe.tue.nl)
- [ ] Enable Email Sending = ON

---

## 📞 Поддержка

- SendGrid docs: https://docs.sendgrid.com
- Gmail SMTP: https://support.google.com/mail/answer/7126229
- Mailgun docs: https://documentation.mailgun.com

**Проблемы с настройкой?**
Проверьте консоль браузера (F12) и server logs для деталей ошибок.