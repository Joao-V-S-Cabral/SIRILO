const connection = require('../database/connection');
const auditoriaService = require('../services/auditoria.service');
const { emitirToken } = require('../services/jwt.service');

class AuthController {
  /**
   * POST /api/auth/login
   *
   * Suporta dois fluxos de autenticação, diferenciados pelo corpo da requisição:
   *  - Admin / Proprietário: { email, senha }
   *  - Procurador:           { email, token_reuniao }
   *
   * Regra de negócio: cada procurador possui um token_reuniao ÚNICO por
   * representação. Caso represente mais de um proprietário, ele terá
   * registros e tokens distintos, exigindo login individual para cada um.
   */
  async login(req, res) {
    const { email, senha, token_reuniao } = req.body;

    if (!email || (!senha && !token_reuniao)) {
      return res.status(400).json({
        error: 'Informe email e senha (Admin/Proprietário) ou email e token_reuniao (Procurador).'
      });
    }

    try {
      // ----- Fluxo Procurador -----
      if (token_reuniao) {
        const procurador = await connection('procuradores')
          .where({ email, token_reuniao })
          .first();

        if (!procurador) {
          return res.status(401).json({ error: 'Token de procurador ou email inválidos.' });
        }

        const proprietarioRepresentado = await connection('proprietarios')
          .where({ id: procurador.proprietario_id })
          .first();

        if (!proprietarioRepresentado) {
          return res.status(404).json({ error: 'Proprietário representado não encontrado.' });
        }

        await auditoriaService.registrar(req, {
          procurador_id: procurador.id,
          acao: `Login (Procurador) representando proprietario_id=${proprietarioRepresentado.id}`
        });

        const token = emitirToken({
          perfil: 'Procurador',
          proprietario_id: proprietarioRepresentado.id,
          procurador_id: procurador.id,
          reuniao_id: procurador.reuniao_id
        });

        return res.json({
          token,
          perfil: 'Procurador',
          procurador_id: procurador.id,
          reuniao_id: procurador.reuniao_id,
          proprietario_representado: {
            id: proprietarioRepresentado.id,
            nome: proprietarioRepresentado.nome,
            lotes: proprietarioRepresentado.lotes,
            peso_voto: proprietarioRepresentado.peso_voto,
            inadimplente: !!proprietarioRepresentado.inadimplente
          }
        });
      }

      // ----- Fluxo Admin / Proprietário -----
      const usuario = await connection('proprietarios')
        .where({ email, senha })
        .first();

      if (!usuario) {
        return res.status(401).json({ error: 'Email ou senha inválidos.' });
      }

      await auditoriaService.registrar(req, {
        proprietario_id: usuario.id,
        acao: `Login (${usuario.tipo_acesso})`
      });

      const token = emitirToken({
        perfil: usuario.tipo_acesso, // 'Admin' ou 'Proprietario'
        proprietario_id: usuario.id,
        procurador_id: null,
        reuniao_id: null
      });

      return res.json({
        token,
        perfil: usuario.tipo_acesso, // 'Admin' ou 'Proprietario'
        proprietario_id: usuario.id,
        nome: usuario.nome,
        lotes: usuario.lotes,
        peso_voto: usuario.peso_voto,
        inadimplente: !!usuario.inadimplente
      });
    } catch (error) {
      console.error('[Auth Error]', error);
      return res.status(500).json({ error: 'Erro ao processar login.', details: error.message });
    }
  }
}

module.exports = new AuthController();
