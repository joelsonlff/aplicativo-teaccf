# Princípios de UX para TEA — Plataforma Coração Feliz

Este documento define os princípios inegociáveis de design da interface mobile
para crianças com Transtorno do Espectro Autista.

---

## 1. Baixo Estímulo Visual

**Regra:** A interface nunca deve competir pela atenção da criança.

- Fundo sólido, cor neutra (não branco puro — use `#F5F2EE`)
- Máximo 3 elementos interativos visíveis por tela
- Sem banners, pop-ups não solicitados ou notificações durante atividade
- Sem gradientes complexos — apenas cores sólidas ou gradientes muito suaves
- Paleta restrita: apenas as cores definidas em `frontend-mobile/src/config/theme.ts`

---

## 2. Previsibilidade e Consistência

**Regra:** A criança deve sempre saber onde está e o que vai acontecer.

- Mesma posição para o botão de pausa em todas as atividades
- Transições lentas e suaves (350ms mínimo, sem efeitos bruscos)
- Feedback visual imediato após toda interação (< 100ms)
- Nunca mover elementos da UI inesperadamente
- Sequência de telas sempre a mesma: Home → Atividade → Feedback

---

## 3. Alvos de Toque Grandes

**Regra:** Toda área tocável deve ter no mínimo 64x64px.

- Botões primários: 80px de altura (confortável)
- Botões de ação grande (JOGAR): 100px+ de altura
- Espaçamento mínimo entre alvos: 16px (evitar toques acidentais)
- Tolerância de toque: usar `hitSlop` no React Native onde necessário

---

## 4. Feedback Multimodal

**Regra:** Todo acerto deve ter feedback visual + sonoro + tátil.

- **Visual:** animação suave de aprovação (não piscante, não rápida)
- **Sonoro:** som suave e agradável (não assustador, não muito alto)
- **Tátil:** haptic feedback `NotificationFeedbackType.Success`

Para erros:
- **Nunca** usar cor vermelha intensa ou som agressivo
- Destaque suave + pausa de 1 segundo + volta ao estado anterior
- Som de "tente novamente" — jamais som de "errou"

---

## 5. Informação Reduzida por Tela

**Regra:** Uma tela, uma mensagem.

- Tela inicial: nome da criança + uma atividade disponível + progresso do dia
- Tela de atividade: apenas os elementos da atividade + botão pausa
- Tela de feedback: resultado + animação + um único botão de ação
- Instruções: máximo 1 frase curta OU um ícone de áudio (por preferência configurada)

---

## 6. Suporte a Não-Verbal

**Regra:** Nenhuma funcionalidade deve exigir leitura de texto.

- Todo texto acompanhado de ícone quando possível
- Opção de instruções em áudio para todas as atividades
- Imagens descritivas em vez de rótulos textuais onde aplicável
- Progresso em ícones (estrelas, círculos) — nunca em porcentagem

---

## 7. Tempo e Pressão

**Regra:** Nunca criar pressão de tempo ansiogênica.

- Temporizadores visuais (barra que diminui, não contagem regressiva numérica)
- Pausa automática se não houver interação por 30 segundos (sem punição)
- Dica visual após 10 segundos de inatividade (configurável por criança)
- Nunca exibir "tempo esgotado" em vermelho — usar mensagem encorajadora

---

## 8. Reforço Positivo Incondicional

**Regra:** A criança sempre recebe encorajamento, independente do resultado.

Exemplos de mensagens na tela de feedback:
- ✓ "Você completou! Ótimo trabalho!"
- ~ "Você tentou! Isso é o que importa!"
- ✗ (evitar framing de fracasso — nunca "Você errou")

A animação de celebração é sempre exibida. A intensidade varia com o score,
mas nunca ausente.

---

## 9. Configurações por Criança

Os seguintes parâmetros de acessibilidade são configurados no perfil TEA e
respeitados pela interface:

| Parâmetro | Opções |
|---|---|
| `communication_level` | VERBAL / SEMI_VERBAL / NON_VERBAL |
| `reinforcement_type` | VISUAL / AUDITORY / COMBINED |
| `sensory_profile` | HYPERSENSITIVE / HYPOSENSITIVE / MIXED |
| `preferred_modalities` | visual / auditory / tactile |

HYPERSENSITIVE → reduzir sons, haptics mais suaves, cores ainda mais neutras
HYPOSENSITIVE → pode tolerar mais feedback sensorial

---

## 10. Testes com Usuários Reais

Antes de cada release mobile:
- Testar com ao menos 2 crianças com TEA em ambiente supervisionado
- Observar (não guiar) por 10 minutos de uso
- Registrar: onde parou, onde ficou confuso, onde sorriu
- Qualquer tela que cause frustração é um bug de UX
