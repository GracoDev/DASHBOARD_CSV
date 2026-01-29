## 📋 Requisitos

- Docker Desktop instalado e rodando
- Git instalado
- Portas disponíveis: 3000, 3001, 5000, 8080, 5432

## 🚀 Como começar

### 1. Clonar o repositório

```bash
git clone <https://github.com/GracoDev/CASE-SOLOMON.git>
cd CASE-SOLOMON
```

### 2. Subir os serviços

```bash
docker compose up --build -d
```

### 3. Verificar se está tudo rodando

```bash
docker compose ps
```

Todos os 7 serviços devem estar com status "Up".

## 🎯 Como usar o sistema

### 1. Acessar o Dashboard

Abra seu navegador e acesse:

```
http://localhost:3001
```

### 2. Fazer Login

**Credenciais padrão:**
- **Usuário:** `admin`
- **Senha:** `admin123`

### 3. Sincronizar dados

Após fazer login, você verá o dashboard vazio. Para carregar os dados:

1. Clique no botão **"🔄 Sincronizar Dados"** no topo da página
2. Aguarde a mensagem de sucesso
3. Os dados serão carregados automaticamente

### 4. Explorar o Dashboard

Após sincronizar, você verá:
- **Cards de métricas**: Receitas e pedidos por status (Aprovado, Pendente, Cancelado)
- **Gráfico de séries temporais**: Evolução das métricas ao longo do tempo
- **Filtros**: Data inicial, data final e método de pagamento

## 🔧 Desenvolvimento e Teste Local

Antes de fazer deploy, é recomendado testar suas alterações localmente usando Docker Compose.

### Build e Teste de Serviços Individuais

Para fazer build e testar um serviço específico:

**Frontend:**
```bash
docker compose build frontend
docker compose up frontend
```

**Backend 1 (Auth):**
```bash
docker compose build backend1-auth
docker compose up backend1-auth
```

**Backend 2 (API):**
```bash
docker compose build backend2-api
docker compose up backend2-api
```

**Data Source:**
```bash
docker compose build data-source
docker compose up data-source
```

**Pipeline:**
```bash
docker compose build pipeline
docker compose up pipeline
```

**Transformer:**
```bash
docker compose build transformer
docker compose up transformer
```

### Build e Teste de Todos os Serviços

Para fazer build e subir todos os serviços de uma vez:

```bash
docker compose build
docker compose up
```

Ou em modo detached (background):

```bash
docker compose up --build -d
```

### Parar os Serviços

Para parar todos os serviços:

```bash
docker compose down
```

Para parar um serviço específico:

```bash
docker compose stop frontend
```

### Ver Logs

Para ver os logs de todos os serviços:

```bash
docker compose logs
```

Para ver logs de um serviço específico:

```bash
docker compose logs frontend
docker compose logs backend1-auth
docker compose logs backend2-api
```

### Fluxo de Trabalho Recomendado

1. **Fazer alterações no código**
2. **Testar localmente:**
   ```bash
   docker compose build frontend  # ou o serviço que você alterou
   docker compose up frontend    # testar se está funcionando
   ```
3. **Verificar se está tudo OK** acessando `http://localhost:3001` (ou a porta do serviço)
4. **Se estiver tudo certo, fazer deploy:**
   ```bash
   git add .
   git commit -m "Descrição das mudanças"
   git push  # Deploy automático acontece aqui
   ```

## 🌐 URLs dos Serviços

### Frontend (Dashboard Principal)
```
http://localhost:3001
```

### Backend 1 (Auth)
```
http://localhost:5000
http://localhost:5000/health
```

### Backend 2 (Query API)
```
http://localhost:8080
http://localhost:8080/health
```

### Data Source Server
```
http://localhost:3000
http://localhost:3000/health
```

### pgAdmin (Interface gráfica do PostgreSQL)
```
http://localhost:5050
```

**Credenciais pgAdmin:**
- Email: `admin@admin.com`
- Senha: `admin`

### Como visualizar os dados no pgAdmin

1. **Conectar ao servidor PostgreSQL:**
   - Clique com botão direito em "Servers" → "Register" → "Server"
   - Na aba "General":
     - **Name:** `PostgreSQL` (ou qualquer nome)
   - Na aba "Connection":
     - **Host name/address:** `postgres`
     - **Port:** `5432`
     - **Maintenance database:** `analytics_db`
     - **Username:** `postgres`
     - **Password:** `postgres`
   - Clique em "Save"

2. **Visualizar dados brutos (raw_data):**
   - Expanda: `Servers` → `PostgreSQL` → `Databases` → `analytics_db` → `Schemas` → `raw_data` → `Tables` → `orders`
   - Clique com botão direito em `orders` → "View/Edit Data" → "All Rows"
   - Você verá todos os pedidos inseridos pelo pipeline

3. **Visualizar dados agregados (aggregated):**
   - Expanda: `Servers` → `PostgreSQL` → `Databases` → `analytics_db` → `Schemas` → `aggregated` → `Tables` → `daily_metrics`
   - Clique com botão direito em `daily_metrics` → "View/Edit Data" → "All Rows"
   - Você verá as métricas agregadas por dia, status e método de pagamento

**Nota:** Os dados só aparecerão após executar a sincronização no dashboard (botão "🔄 Sincronizar Dados").
