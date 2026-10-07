# forlinks https://forlinks.vercel.app/

Página de links (link in bio) com painel de administração oculto. Next.js 15 (App Router), JavaScript, sem dependências de UI. Dados em Vercel Blob privado.

© Cyberdev. Todos os direitos reservados. Suporte: cyberdevsoficial@gmail.com

## Licença e créditos

O uso, a modificação e a distribuição são autorizados **com a condição de manter os créditos ao autor, Cyberdev**: preservar o aviso `© Cyberdev` e o arquivo `LICENSE`, e dar crédito visível ("Criado por Cyberdev") em qualquer site ou produto publicado a partir deste código. Texto completo em [`LICENSE`](./LICENSE).

## Recursos

- Página pública responsiva: perfil fixo à esquerda e links à direita no desktop, coluna única no mobile.
- Tema escuro, destaque `#B6FF3B` com degradê, paletas prontas e cores personalizadas.
- Painel oculto: clique 5x no `©` do rodapé.
- Links ilimitados, seções, reordenação (arrastar ou setas), ativar/desativar, contador de cliques.
- Perfil editável: nome, identificador, bio, foto, SEO, redes sociais no topo.
- Ícones em SVG, PNG, JPG, WEBP, GIF, AVIF e ICO (upload até 2 MB ou URL https).
- Login e senha validados no servidor; troca obrigatória no primeiro acesso.

## Estrutura

```
app/
  layout.js            fontes e metadados
  page.js              página pública (lê a config no servidor)
  globals.css          todo o visual (página e painel)
  icon.svg             favicon
  components/
    LinkPage.js        página pública + gatilho dos 5 cliques
    Admin.js           login, troca de senha e painel
  api/
    auth/login         POST   entra e cria a sessão
    auth/logout        POST   encerra a sessão
    auth/session       GET    estado da sessão
    auth/password      POST   troca usuário e senha
    admin/config       GET/PUT  lê e grava links, perfil e tema
    admin/upload       POST   envia ícone (valida o conteúdo)
    media/[name]       GET    serve ícones do Blob privado
    click              POST   conta cliques
lib/
  shared.js            padrões, paletas, helpers (cliente e servidor)
  sanitize.js          validação de tudo que o painel envia
  store.js             leitura e escrita no Vercel Blob
  auth.js              hash, sessão, verificação de credenciais
  http.js              respostas JSON, checagem de origem, limite de taxa
```

## Segurança

- Credenciais e sessão ficam só no servidor. O front nunca recebe senha, hash nem segredo.
- Senha com scrypt e salt. Sessão em cookie `httpOnly`, `secure`, `sameSite=strict`, assinada com HMAC (`APP_SECRET`), validade de 8 h. Trocar a senha invalida as sessões antigas.
- Rotas de escrita exigem sessão válida e mesma origem. Login e troca de senha têm limite de tentativas.
- Todo dado do painel passa por `sanitize.js`: só URLs `http`, `https`, `mailto` e `tel`; cores em hex; tamanhos limitados.
- Upload valida o tipo pelos bytes do arquivo e recusa SVG com script. Ícones saem com `nosniff` e CSP restritiva.
- Blob privado: nada é acessível sem passar pelo servidor.
- Cabeçalhos de segurança em `next.config.mjs`.

Limitação: o limite de tentativas fica em memória de cada instância da função.

## Variáveis de ambiente

| Nome | Uso |
| --- | --- |
| `APP_SECRET` | Texto aleatório com 32+ caracteres. Gere com `openssl rand -base64 48`. |
| `BLOB_READ_WRITE_TOKEN` | Criado pela Vercel ao conectar o Blob ao projeto. |

## Primeiro acesso

Usuário `admin`, senha `admin123`. O painel exige trocar os dois no primeiro login (senha com 10+ caracteres, letras e números).

## Deploy na Vercel

```bash
npm install
npx vercel link
npx vercel blob create-store forlinks-data --access private   # conecte ao projeto
npx vercel env add APP_SECRET
npx vercel --prod
```

## Desenvolvimento local

```bash
npm install
vercel env pull .env.local
npm run dev
```

## Dados no Blob

- `data/config.json`: perfil, tema, SEO, redes e links
- `data/auth.json`: usuário, hash da senha e versão da sessão
- `data/stats.json`: cliques por link
- `media/*`: ícones enviados (os não usados são removidos ao salvar)
