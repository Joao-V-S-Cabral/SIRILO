import client from './client';

export function loginComSenha(email, senha) {
  return client.post('/auth/login', { email, senha }).then((res) => res.data);
}

export function loginComToken(email, token_reuniao) {
  return client.post('/auth/login', { email, token_reuniao }).then((res) => res.data);
}
