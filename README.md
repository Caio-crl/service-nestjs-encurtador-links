# Nome do projeto: worker-nestjs-teste

## Running locally

Requisitos: Docker com Compose e Node.js 22 ou superior para executar os testes no host.

1. Copie `.env.example` para `.env` e substitua as duas senhas de exemplo por
   valores locais. Mantenha `DB_HOST=127.0.0.1` e um `DB_NAME` terminado em
   `_local` para os testes E2E. O arquivo `.env` não deve ser versionado.
2. Suba o MySQL e construa a imagem da API:

   ```sh
   docker compose up -d mysql
   docker compose build app
   ```

3. Execute a migration inicial antes de iniciar a API:

   ```sh
   docker compose run --rm app npm run migration:run:compiled
   ```

4. Inicie a aplicação:

   ```sh
   docker compose up -d app
   ```

5. Acesse `http://localhost:3000/health` e o Swagger em
   `http://localhost:3000/v1/docs/swagger` (ajuste a porta se alterar `PORT`).
6. Instale as dependências no host e execute os testes unitários e E2E:

   ```sh
   npm ci
   npm test -- --runInBand
   npm run test:e2e
   ```

Os testes E2E usam a API e o MySQL locais em execução, validam o schema e
removem apenas os links criados por eles (os respectivos cliques são removidos
pela foreign key). Não executam `synchronize` nem recriam tabelas.

## Persistência

O esquema inicial de `links` e `clicks` está em uma migration TypeORM.
`synchronize` permanece desativado; a migration não é executada ao iniciar a API.

Para executar ou reverter migrations, defina `DB_HOST`, `DB_USER`,
`DB_PASSWORD` e `DB_NAME` no ambiente. `DB_PORT` é opcional e usa `3306`
por padrão. Depois, use `npm run migration:run` ou
`npm run migration:revert` contra o banco desejado.

## Criação de links

Defina `APP_BASE_URL` com a origem HTTP(S) pública da API (por exemplo,
`http://localhost:3000`). O endpoint `POST /links` recebe `{ "url":
"https://example.com/page" }` e devolve o link criado com `shortUrl` baseado
nessa origem. O campo `slug` é gerado pelo servidor e não é aceito na entrada.

## Redirect

`GET /:slug` registra um Click e responde com HTTP 302 e `Location` apontando
para a URL original. Um slug inexistente retorna 404. Se o registro do Click
falhar, o redirect não é enviado.

## Analytics básico

`GET /links/:slug/analytics` retorna o slug, a URL original, a data de criação,
o total de cliques e a data do clique mais recente. Para links ainda não
acessados, `totalClicks` é `0` e `lastClickAt` é `null`.
