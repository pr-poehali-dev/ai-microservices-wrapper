"""Аутентификация: регистрация, вход по email, OAuth (Google, VK, Яндекс, Telegram), профиль, выход"""
import json
import os
import hashlib
import hmac
import secrets
import time
import urllib.request
from datetime import datetime, timedelta

import psycopg2


def get_db():
    db_url = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(db_url, options=f'-c search_path={schema}')
    return conn, schema


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token() -> str:
    return secrets.token_hex(32)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
    }


def json_response(data, status=200):
    return {
        'statusCode': status,
        'headers': {**cors_headers(), 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False, default=str)
    }


def create_session(conn, schema, user_id: int) -> str:
    token = generate_token()
    expires_at = datetime.now() + timedelta(days=30)
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {schema}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires_at)
    )
    conn.commit()
    return token


def get_user_by_token(conn, schema, token: str):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT u.id, u.email, u.name, u.avatar_url, u.provider
        FROM {schema}.users u
        JOIN {schema}.sessions s ON s.user_id = u.id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    if row:
        return {'id': row[0], 'email': row[1], 'name': row[2], 'avatar_url': row[3], 'provider': row[4]}
    return None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    action = body.get('action') or (event.get('queryStringParameters') or {}).get('action', '')

    conn, schema = get_db()
    S = schema  # shorthand

    # register
    if action == 'register':
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        name = body.get('name', '').strip()
        if not email or not password:
            return json_response({'error': 'Email и пароль обязательны'}, 400)
        if len(password) < 6:
            return json_response({'error': 'Пароль минимум 6 символов'}, 400)
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {S}.users WHERE email = %s", (email,))
        if cur.fetchone():
            return json_response({'error': 'Email уже зарегистрирован'}, 409)
        display_name = name or email.split('@')[0]
        cur.execute(
            f"INSERT INTO {S}.users (email, password_hash, name, provider) VALUES (%s, %s, %s, 'email') RETURNING id",
            (email, hash_password(password), display_name)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        token = create_session(conn, S, user_id)
        return json_response({'token': token, 'user': {'id': user_id, 'email': email, 'name': display_name}})

    # login
    if action == 'login':
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, avatar_url FROM {S}.users WHERE email = %s AND password_hash = %s AND provider = 'email'",
            (email, hash_password(password))
        )
        row = cur.fetchone()
        if not row:
            return json_response({'error': 'Неверный email или пароль'}, 401)
        token = create_session(conn, S, row[0])
        return json_response({'token': token, 'user': {'id': row[0], 'email': email, 'name': row[1], 'avatar_url': row[2]}})

    # me
    if action == 'me':
        auth = event.get('headers', {}).get('x-authorization', '') or event.get('headers', {}).get('X-Authorization', '')
        token = auth.replace('Bearer ', '').strip()
        if not token:
            return json_response({'error': 'Не авторизован'}, 401)
        user = get_user_by_token(conn, S, token)
        if not user:
            return json_response({'error': 'Сессия истекла'}, 401)
        return json_response({'user': user})

    # logout
    if action == 'logout':
        auth = event.get('headers', {}).get('x-authorization', '') or event.get('headers', {}).get('X-Authorization', '')
        token = auth.replace('Bearer ', '').strip()
        if token:
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {S}.sessions WHERE token = %s", (token,))
            conn.commit()
        return json_response({'ok': True})

    # oauth — обработка токенов от провайдеров
    if action == 'oauth':
        provider = body.get('provider')
        access_token = body.get('access_token')
        user_data = body.get('user_data', {})

        if not provider:
            return json_response({'error': 'Провайдер не указан'}, 400)

        name = ''
        email = None
        avatar_url = None
        provider_id = None

        if provider == 'google':
            req = urllib.request.Request(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            with urllib.request.urlopen(req) as resp:
                info = json.loads(resp.read())
            provider_id = info.get('sub')
            email = info.get('email')
            name = info.get('name', '')
            avatar_url = info.get('picture')

        elif provider == 'vk':
            req = urllib.request.Request(
                f'https://api.vk.com/method/users.get?fields=photo_200&access_token={access_token}&v=5.131'
            )
            with urllib.request.urlopen(req) as resp:
                info = json.loads(resp.read())
            vk_user = info.get('response', [{}])[0]
            provider_id = str(vk_user.get('id', ''))
            name = f"{vk_user.get('first_name', '')} {vk_user.get('last_name', '')}".strip()
            avatar_url = vk_user.get('photo_200')

        elif provider == 'yandex':
            req = urllib.request.Request(
                'https://login.yandex.ru/info?format=json',
                headers={'Authorization': f'OAuth {access_token}'}
            )
            with urllib.request.urlopen(req) as resp:
                info = json.loads(resp.read())
            provider_id = info.get('id')
            email = info.get('default_email')
            name = info.get('real_name') or info.get('login', '')
            avatar_id = info.get('default_avatar_id')
            if avatar_id:
                avatar_url = f'https://avatars.yandex.net/get-yapic/{avatar_id}/islands-200'

        elif provider == 'telegram':
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
            tg_data = user_data.copy()
            check_hash = tg_data.pop('hash', '')
            data_check_string = '\n'.join(sorted([f'{k}={v}' for k, v in tg_data.items()]))
            secret_key = hashlib.sha256(bot_token.encode()).digest()
            h = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256)
            expected = h.hexdigest()
            if not hmac.compare_digest(expected, check_hash):
                return json_response({'error': 'Неверная подпись Telegram'}, 401)
            auth_date = int(tg_data.get('auth_date', 0))
            if time.time() - auth_date > 86400:
                return json_response({'error': 'Данные Telegram устарели'}, 401)
            provider_id = str(tg_data.get('id', ''))
            name = f"{tg_data.get('first_name', '')} {tg_data.get('last_name', '')}".strip()
            avatar_url = tg_data.get('photo_url')

        else:
            return json_response({'error': 'Неизвестный провайдер'}, 400)

        if not provider_id:
            return json_response({'error': 'Не удалось получить данные пользователя'}, 400)

        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {S}.users WHERE provider = %s AND provider_id = %s", (provider, provider_id))
        row = cur.fetchone()

        if row:
            user_id = row[0]
            cur.execute(f"UPDATE {S}.users SET name = %s, avatar_url = %s, updated_at = NOW() WHERE id = %s", (name, avatar_url, user_id))
        else:
            if email:
                cur.execute(f"SELECT id FROM {S}.users WHERE email = %s", (email,))
                existing = cur.fetchone()
                if existing:
                    user_id = existing[0]
                    cur.execute(
                        f"UPDATE {S}.users SET provider = %s, provider_id = %s, avatar_url = %s, updated_at = NOW() WHERE id = %s",
                        (provider, provider_id, avatar_url, user_id)
                    )
                else:
                    cur.execute(
                        f"INSERT INTO {S}.users (email, name, avatar_url, provider, provider_id) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                        (email, name, avatar_url, provider, provider_id)
                    )
                    user_id = cur.fetchone()[0]
            else:
                cur.execute(
                    f"INSERT INTO {S}.users (name, avatar_url, provider, provider_id) VALUES (%s, %s, %s, %s) RETURNING id",
                    (name, avatar_url, provider, provider_id)
                )
                user_id = cur.fetchone()[0]

        conn.commit()
        token = create_session(conn, S, user_id)
        return json_response({'token': token, 'user': {'id': user_id, 'email': email, 'name': name, 'avatar_url': avatar_url}})

    # oauth_url — URL для редиректа
    if action == 'oauth_url':
        provider = body.get('provider') or (event.get('queryStringParameters') or {}).get('provider', '')
        redirect_uri = body.get('redirect_uri', '')

        if provider == 'google':
            client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
            url = (f'https://accounts.google.com/o/oauth2/v2/auth'
                   f'?client_id={client_id}'
                   f'&redirect_uri={redirect_uri}'
                   f'&response_type=token'
                   f'&scope=openid%20email%20profile')
            return json_response({'url': url})

        elif provider == 'vk':
            client_id = os.environ.get('VK_CLIENT_ID', '')
            url = (f'https://oauth.vk.com/authorize'
                   f'?client_id={client_id}'
                   f'&redirect_uri={redirect_uri}'
                   f'&response_type=token'
                   f'&scope=email')
            return json_response({'url': url})

        elif provider == 'yandex':
            client_id = os.environ.get('YANDEX_CLIENT_ID', '')
            url = (f'https://oauth.yandex.ru/authorize'
                   f'?response_type=token'
                   f'&client_id={client_id}')
            return json_response({'url': url})

        elif provider == 'telegram':
            bot_name = os.environ.get('TELEGRAM_BOT_NAME', '')
            return json_response({'bot_name': bot_name})

        return json_response({'error': 'Провайдер не найден'}, 400)

    return json_response({'ok': True, 'actions': ['register', 'login', 'me', 'logout', 'oauth', 'oauth_url']})
