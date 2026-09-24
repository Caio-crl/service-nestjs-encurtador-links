# Nome do projeto: worker-nestjs-teste

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
