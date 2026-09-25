# Princípios do projeto — URL Shortener API

## Objetivo e contexto

Backend NestJS para criar links curtos, redirecionar acessos e consultar analytics básicos. O MVP prioriza um fluxo simples e verificável com MySQL real; não inclui frontend, autenticação ou infraestrutura de filas.

## Vocabulário

- Link: URL original, slug único e datas de criação/atualização.
- Slug: identificador público alfanumérico de seis caracteres, gerado aleatoriamente.
- Click: registro mínimo de um acesso válido, associado a um Link e com data/hora.
- Analytics: total de Clicks e data/hora do Click mais recente de um Link.

## Fluxos e regras

- Criação: POST /links recebe uma URL HTTP(S) válida, gera um slug, verifica colisão e persiste o Link. O banco mantém UNIQUE no slug; o serviço tenta até cinco vezes e trata colisão concorrente.
- Redirect: GET /:slug procura o Link, persiste um Click e só então retorna 302 para originalUrl. Slug inexistente resulta em 404; falha ao salvar Click não deve parecer um redirect bem-sucedido.
- Analytics: GET /links/:slug/analytics retorna apenas slug, originalUrl, totalClicks, createdAt e lastClickAt. Sem Clicks, o total é 0 e lastClickAt é null.
- Health: GET /health retorna o estado básico da API.

## Arquitetura existente

Controller → ApiService → AppService → repositories TypeORM → MySQL. DTOs e validação ficam em src/api; entidades, repositories e migration ficam em src/common/database; testes unitários ficam junto ao código e E2E em test/.

## Limites do MVP

Não registrar IP, user-agent ou outros dados de visitante. Não adicionar autenticação, dashboard, cache, filas, workers ou endpoints de gestão sem novo escopo. Não mudar o schema implicitamente: synchronize e migrationsRun permanecem false e mudanças de banco exigem migration.

## Convenções e validações

Nomes de domínio: LinkEntity, ClickEntity, LinkRepository e ClickRepository. Usar UUID para IDs e APP_BASE_URL para construir shortUrl. Validar com build, lint e testes unitários; o E2E depende de API e MySQL reais locais e limpa somente os Links que cria.
