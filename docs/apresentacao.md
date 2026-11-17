# Wylder Trails — Apresentação do Produto

## Visão do Produto

Wylder Trails é uma plataforma mobile colaborativa para trilheiros. Resolve o problema de falta de informação confiável sobre trilhas: condições de terreno, perigos, acessibilidade, e a possibilidade de navegar sem internet em áreas sem sinal.

---

## Problema que Resolve

| Dor do Usuário | Solução |
|----------------|---------|
| "Não sei se a trilha tem estacionamento" | Campo específico no cadastro |
| "Preciso saber se é perigosa para iniciantes" | Dificuldade + mapa de perigos |
| "Perco o sinal no meio da trilha" | Modo offline com Mapbox tiles |
| "Não sei quantas horas vou levar" | Tempo estimado por GPS real |
| "Quero fotos reais, não de banco de imagens" | Upload direto de fotos dos trilheiros |
| "Não sei se precisa de equipamento de escalada" | Atributo específico |

---

## Funcionalidades Principais

### 🗺️ Feed de Trilhas
- Cards visuais com foto, dificuldade colorida, distância e nota
- Ordenação por proximidade (GPS), mais bem avaliadas ou mais recentes
- Filtros rápidos: dificuldade, estacionamento, cachoeiras, acampamento

### 📍 Cadastro de Trilha
- Gravação de rota GPS em tempo real (cronômetro + distância acumulada)
- Atributos completos: dificuldade, terreno, meios de acesso, infraestrutura
- Upload de até 20 fotos (câmera ou galeria)
- Marcação de épocas recomendadas e fauna/flora notáveis

### 🗺️ Mapa Interativo (Mapbox)
- Visualização de trilhas com marcadores coloridos por dificuldade
- Rota desenhada, waypoints e pontos de perigo
- Camadas: Outdoors, Satélite, Padrão
- Suporte a mapas offline (download da área)

### ⭐ Avaliações
- Nota de 1 a 5 estrelas
- Comentário livre (até 500 chars)
- Média recalculada automaticamente
- Regra: autor não avalia a própria trilha

### 📱 Offline
- Salva trilha completa para navegação sem internet
- Tiles Mapbox baixados para a área
- Sincronização automática ao voltar a ter conexão

### 👤 Perfil
- Sistema de níveis: Iniciante → Explorador → Veterano
- Seguir outros trilheiros
- Histórico de trilhas e trilhas salvas offline

---

## Mapa de Perigos — Destaque

Cada trilha pode ter pontos de perigo marcados no mapa:
- 🔴 Deslizamento
- 🟠 Animais peçonhentos
- 🔵 Área alagada
- ⚫ Queda de pedras
- 🟡 Travessia perigosa

Esses pontos ficam visíveis para todos os usuários no mapa da trilha.

---

## Arquitetura Técnica

```
App Mobile (Expo)
      ↓ HTTPS
API REST (Node.js + Express)
      ↓
PostgreSQL + Firebase Auth/Storage
      ↓
Mapbox (mapas, rotas, offline)
```

**Deploy:**
- API → Railway (auto-deploy do GitHub)
- App → Expo EAS (APK + distribuição)

---

## Spec Driven Development

O projeto foi desenvolvido com 4 arquivos de especificação:

1. **ARCHITECTURE.md** — Camadas, módulos e fluxo de dados
2. **STACK.md** — Tecnologias, versões e configuração de ambiente
3. **BUSINESS_RULES.md** — 31 regras de negócio documentadas
4. **SPEC.md** — Feature completa com endpoints, telas, modelo de dados e critérios de aceite

---

## Critérios de Aceite Verificados

| ID | Critério | Status |
|----|----------|--------|
| AC-01 | Cadastrar trilha com campos obrigatórios | ✅ |
| AC-02 | GPS em tempo real | ✅ |
| AC-03 | Upload de fotos ao Firebase | ✅ |
| AC-04 | Trilha aparece no feed | ✅ |
| AC-05 | Mapa com rota, waypoints e perigos | ✅ |
| AC-06 | Busca e filtros funcionais | ✅ |
| AC-07 | Modo offline | ✅ |
| AC-08 | Média de nota atualizada | ✅ |
| AC-09 | Autor não avalia própria trilha | ✅ |
| AC-10 | Pontos de perigo visíveis no mapa | ✅ |

---

## Repositório

**GitHub:** [https://github.com/SEU_USUARIO/wylder-trails](https://github.com/SEU_USUARIO/wylder-trails)

---

*Projeto desenvolvido para a disciplina Desenvolvimento de Software Apoiado com IA*  
*Ferramenta: GitHub Copilot + Kiro IDE — Padrão: Spec Driven Development*
