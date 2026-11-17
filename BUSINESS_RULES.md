# BUSINESS_RULES.md — Wylder Trails

## Domínio

Wylder Trails é uma plataforma colaborativa para descoberta, registro e navegação de trilhas na natureza. Usuários podem cadastrar trilhas, compartilhar experiências e navegar offline.

---

## Entidades Principais

### Usuário (User)
- Possui nome, e-mail, foto de perfil e data de cadastro.
- Pode seguir outros usuários.
- Acumula histórico de trilhas feitas e cadastradas.
- Nível de trilheiro baseado na quantidade de trilhas completadas: Iniciante (0–5), Explorador (6–20), Veterano (21+).

### Trilha (Trail)
- Entidade central da aplicação.
- Criada por um usuário (autor).
- Contém todos os atributos descritos abaixo.

### Avaliação (Review)
- Vinculada a um usuário e a uma trilha.
- Cada usuário pode fazer apenas **1 avaliação por trilha**.
- Pode ser editada após publicação.

### Ponto de Interesse (Waypoint)
- Localização geográfica marcada dentro de uma trilha.
- Tipos: Entrada, Saída, Cachoeira, Área de Acampamento, Perigo, Ponto de Vista.

---

## Regras de Negócio — Trilhas

### Cadastro
- **BR-01**: O nome da trilha é obrigatório e deve ter entre 3 e 100 caracteres.
- **BR-02**: A localização (cidade, estado, país) é obrigatória.
- **BR-03**: A dificuldade deve ser uma das opções: `fácil`, `moderada`, `difícil`.
- **BR-04**: A distância em quilômetros é obrigatória e deve ser um número positivo.
- **BR-05**: O percurso GPS (array de coordenadas lat/lng) é obrigatório para publicação.
- **BR-06**: Uma trilha pode ter no máximo **20 fotos**.
- **BR-07**: Fotos devem ter no máximo **10 MB** cada e formato JPG, PNG ou WEBP.
- **BR-08**: O tempo estimado de duração é calculado automaticamente pelo GPS, mas pode ser ajustado manualmente.

### Atributos Booleanos (checkboxes)
- `has_parking` — Possui estacionamento
- `is_accessible_by_car` — Acessível de carro
- `is_accessible_by_motorcycle` — Acessível de moto
- `is_accessible_by_bicycle` — Acessível de bicicleta
- `is_accessible_on_foot` — Acessível a pé (sempre verdadeiro por padrão)
- `has_cell_signal` — Possui sinal de celular
- `has_waterfall` — Possui cachoeira
- `has_camping` — Possui área de acampamento
- `has_river_crossing` — Necessário atravessar rios/riachos
- `has_climbing` — Necessário fazer escalada

### Tipo de Terreno
- **BR-09**: O tipo de terreno deve ser: `íngreme`, `plano` ou `mesclado`.

### Mapa de Perigos
- **BR-10**: Usuários podem marcar pontos de perigo na rota com tipo: `deslizamento`, `animais peçonhentos`, `área alagada`, `queda de pedras`, `travessia perigosa`.
- **BR-11**: Pontos de perigo ficam visíveis no mapa para todos os usuários.

### Visibilidade
- **BR-12**: Uma trilha pode ser `pública` (visível a todos) ou `privada` (visível apenas ao autor).
- **BR-13**: Trilhas privadas não aparecem no feed nem nas buscas.

### Modo Offline
- **BR-14**: O usuário pode salvar uma trilha para uso offline. Os tiles do mapa e os dados da trilha são baixados no dispositivo.
- **BR-15**: Uma trilha salva offline pode ser navegada sem conexão com a internet.
- **BR-16**: O app sincroniza automaticamente novos reviews e atualizações quando a conexão é restaurada.

---

## Regras de Negócio — Avaliações

- **BR-17**: A nota deve ser de 1 a 5 estrelas (inteiro).
- **BR-18**: O comentário é opcional, mas deve ter no máximo 500 caracteres se fornecido.
- **BR-19**: Um usuário não pode avaliar sua própria trilha.
- **BR-20**: Avaliações são públicas e ordenadas por mais recente por padrão.
- **BR-21**: A nota média da trilha é recalculada a cada nova avaliação.

---

## Regras de Negócio — Usuários

- **BR-22**: E-mail deve ser único no sistema.
- **BR-23**: Senha deve ter no mínimo 8 caracteres, com ao menos 1 letra maiúscula e 1 número.
- **BR-24**: Um usuário pode deletar sua própria conta. Suas trilhas públicas permanecem, mas sem autor visível ("Usuário removido").
- **BR-25**: Um usuário pode seguir qualquer outro usuário (exceto a si mesmo).

---

## Regras de Negócio — Busca e Filtros

- **BR-26**: A busca pode filtrar por: nome, dificuldade, distância máxima (km), país, estado, atributos booleanos.
- **BR-27**: O feed principal mostra trilhas ordenadas por proximidade geográfica por padrão.
- **BR-28**: O usuário pode alternar para ordenação por mais bem avaliadas ou mais recentes.
- **BR-29**: Trilhas de usuários seguidos têm destaque no feed ("De quem você segue").

---

## Regras de Negócio — Época e Condições

- **BR-30**: O autor pode indicar as melhores épocas do ano para a trilha: `verão`, `outono`, `inverno`, `primavera` (múltipla escolha).
- **BR-31**: O autor pode indicar fauna e flora notáveis como texto livre (máx. 300 chars).
