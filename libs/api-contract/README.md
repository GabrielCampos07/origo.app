# Origo API Contract

Contrato OpenAPI da Origo API para documentação e geração de clientes.

## Arquivos

- `openapi.yaml` — Especificação OpenAPI 3.0 dos endpoints

## Status atual (W0.4 + W0.5 stub)

Apenas endpoints de infraestrutura estão documentados:
- `GET /health` — Health check
- `GET /api/v1` — API info

## Próximos passos

Squad BACKEND irá adicionar:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- Endpoints de HEP, sessões, exercícios, etc

## Visualizar

Para visualizar a especificação OpenAPI, use:

```bash
npx @redocly/cli preview-docs libs/api-contract/openapi.yaml
```

Ou abra em [editor.swagger.io](https://editor.swagger.io/)
