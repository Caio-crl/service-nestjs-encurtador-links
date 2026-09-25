# Exemplos de domínio — URL Shortener

Os exemplos abaixo descrevem comportamentos do MVP; IDs, slugs e datas são ilustrativos.

### Exemplo — Criar um link

Input:

```http
POST /links
Content-Type: application/json

{"url":"https://example.com/page"}
```

Contexto necessário: APP_BASE_URL está configurada e o slug gerado está disponível.

Regra de negócio: aceitar apenas URL HTTP(S) válida; o servidor gera um slug alfanumérico de seis caracteres e persiste o Link.

Output esperado: HTTP 201 com id, originalUrl, slug, shortUrl e createdAt.

Não fazer: aceitar slug informado pelo cliente, derivar slug da URL ou devolver sucesso sem persistência.

### Exemplo — URL inválida

Input: POST /links com {"url":"ftp://example.com/page"}.

Regra de negócio: somente http:// e https:// são aceitos.

Output esperado: HTTP 400; nenhum Link criado.

Não fazer: corrigir ou completar automaticamente a URL.

### Exemplo — Redirect válido

Input: GET /aB91xZ.

Contexto necessário: existe um Link com esse slug e originalUrl igual a https://example.com/page.

Regra de negócio: salvar um Click associado ao Link antes de responder.

Output esperado: HTTP 302 com Location: https://example.com/page e um novo Click.

Não fazer: retornar a URL em JSON, registrar dados do visitante ou ignorar falha ao salvar o Click.

### Exemplo — Slug inexistente

Input: GET /000000 ou GET /links/000000/analytics.

Contexto necessário: não existe Link para o slug.

Output esperado: HTTP 404.

Não fazer: criar Link/Click ou expor detalhes do banco.

### Exemplo — Analytics sem acessos

Input: GET /links/aB91xZ/analytics.

Contexto necessário: o Link existe e não possui Clicks.

Output esperado: HTTP 200 com slug, originalUrl, createdAt, totalClicks igual a 0 e lastClickAt igual a null.

Não fazer: carregar todos os Clicks em memória, retornar lista de acessos ou expor dados de visitante.

### Exemplo — Analytics após um acesso

Input: GET /links/aB91xZ/analytics após um redirect válido.

Contexto necessário: existe exatamente um Click para o Link.

Output esperado: HTTP 200 com totalClicks igual a 1 e lastClickAt preenchido.

Não fazer: contar acessos inexistentes ou retornar IDs internos de Click.
