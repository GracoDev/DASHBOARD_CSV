from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import jwt
import datetime
import os
import requests

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas as rotas

# Configuração JWT
JWT_SECRET = os.getenv('JWT_SECRET', 'sua-chave-secreta-super-segura-aqui')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Credenciais fixas em memória
FIXED_USERNAME = 'admin'
FIXED_PASSWORD = 'admin123'

# URL do pipeline (para disparar a ingestão)
PIPELINE_URL = os.getenv('PIPELINE_URL', 'http://pipeline:8080/trigger')


def generate_token(username):
    """Gera um token JWT para o usuário"""
    payload = {
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_token(f):
    """Decorator para verificar o token JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Verificar se o token está no header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Formato esperado: "Bearer <token>"
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Token inválido no header'}), 401
        
        if not token:
            return jsonify({'error': 'Token não fornecido'}), 401
        
        try:
            # Decodificar e verificar o token
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.current_user = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(*args, **kwargs)
    
    return decorated


@app.route('/')
def hello():
    return {
        'service': 'backend1-auth',
        'status': 'running',
        'message': 'Hello from Backend 1 (Auth & Trigger)'
    }


@app.route('/health')
def health():
    return {'status': 'healthy'}, 200


@app.route('/login', methods=['POST'])
def login():
    """Endpoint de login - retorna token JWT"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        # Verificar credenciais
        if username != FIXED_USERNAME or password != FIXED_PASSWORD:
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Gerar token JWT
        token = generate_token(username)
        
        return jsonify({
            'token': token,
            'username': username,
            'expires_in_hours': JWT_EXPIRATION_HOURS
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Erro ao processar login: {str(e)}'}), 500


@app.route('/sync', methods=['POST'])
@verify_token
def sync():
    """Endpoint protegido para disparar o pipeline de ingestão"""
    try:
        # Fazer chamada HTTP para o pipeline
        response = requests.post(
            PIPELINE_URL,
            timeout=30  # Timeout de 30 segundos
        )
        
        if response.status_code == 200:
            return jsonify({
                'message': 'Pipeline de ingestão disparado com sucesso',
                'pipeline_response': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            }), 200
        else:
            return jsonify({
                'error': f'Erro ao disparar pipeline: status {response.status_code}',
                'details': response.text
            }), response.status_code
    
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Timeout ao aguardar resposta do pipeline'}), 504
    
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Não foi possível conectar ao pipeline'}), 503
    
    except Exception as e:
        return jsonify({'error': f'Erro ao disparar pipeline: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
