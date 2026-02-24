import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { backend1API } from '../services/api';
import './Login.css';

function Login() { // componente Login que exibe o formulário de login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const { login } = useAuth(); 
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => { // função para enviar o formulário de login
    e.preventDefault();
    setError('');
    setLoading(true);

    try { // tenta fazer o login
      const response = await backend1API.login(username, password); // Acessa o endpoint POST /login do Backend 1 e recebe o token
      login(response.token); // salva o token
      navigate('/dashboard'); // redireciona para a página de dashboard
    } catch (err) {
      setError(
        err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  return ( // retorna o componente Login que exibe o formulário de login
    <div className="login-container">
      <div className="login-box">
        <h1>Analytics Dashboard</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuário:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Digite seu usuário"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha:</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="login-hint">
          <p>Credenciais padrão:</p>
          <p>Usuário: <strong>admin</strong></p>
          <p>Senha: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}

export default Login;




