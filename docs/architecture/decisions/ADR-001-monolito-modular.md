# ADR-001: Monolito Modular como Arquitetura Inicial

**Data:** 2026-04-16
**Status:** Aceito
**Decisor:** Joelson Fernandes

## Contexto

Precisamos definir a arquitetura do backend da plataforma TEA para a Fase 1.
As opções consideradas foram: monolito simples, monolito modular e microserviços.

## Decisão

Adotar **monolito modular** com separação clara de domínios via módulos internos.

## Justificativa

- Equipe inicial pequena — microserviços prematuro gera overhead desnecessário
- Domínio de negócio (TEA) ainda sendo descoberto — fronteiras de serviço definidas antes de serem compreendidas resultam em retrabalho caro
- Custo operacional: 1 deploy vs. N serviços com load balancers, orquestração e observabilidade distribuída
- Interfaces entre módulos já são definidas como contratos — extração para microserviços na Fase 5 é refatoração cirúrgica, não reescrita

## Consequências

**Positivas:**
- Desenvolvimento mais rápido nas fases iniciais
- Debug simplificado (sem rastreamento distribuído)
- Deploy único por ambiente

**Negativas:**
- Risco de acoplamento se as fronteiras de módulo não forem respeitadas
- Escalabilidade horizontal escala o monolito inteiro, não por módulo

## Revisão prevista

Fase 5 — avaliar extração de módulos de IA e notificações.
