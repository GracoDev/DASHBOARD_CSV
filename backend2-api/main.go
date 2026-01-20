package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
)

type MetricsResponse struct {
	Filters            Filters            `json:"filters"`
	FinancialMetrics   FinancialMetrics   `json:"financial_metrics"`
	OperationalMetrics OperationalMetrics `json:"operational_metrics"`
}

type Filters struct {
	StartDate     string `json:"start_date,omitempty"`
	EndDate       string `json:"end_date,omitempty"`
	PaymentMethod string `json:"payment_method,omitempty"`
}

type FinancialMetrics struct {
	ApprovedRevenue  float64 `json:"approved_revenue"`
	PendingRevenue   float64 `json:"pending_revenue"`
	CancelledRevenue float64 `json:"cancelled_revenue"`
}

type OperationalMetrics struct {
	ApprovedOrders  int `json:"approved_orders"`
	PendingOrders   int `json:"pending_orders"`
	CancelledOrders int `json:"cancelled_orders"`
}

type TimeSeriesResponse struct {
	Filters Filters           `json:"filters"`
	Data    []TimeSeriesPoint `json:"data"`
}

type TimeSeriesPoint struct {
	Date             string  `json:"date"`
	ApprovedRevenue  float64 `json:"approved_revenue"`
	PendingRevenue   float64 `json:"pending_revenue"`
	CancelledRevenue float64 `json:"cancelled_revenue"`
	ApprovedOrders   int     `json:"approved_orders"`
	PendingOrders    int     `json:"pending_orders"`
	CancelledOrders  int     `json:"cancelled_orders"`
}

var jwtSecret string

func main() {
	// Obter JWT_SECRET da variável de ambiente (deve ser a mesma do backend1-auth)
	jwtSecret = os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "minha-chave-secreta-jwt-super-segura" // Fallback para desenvolvimento
		log.Println("⚠️  JWT_SECRET não configurada, usando valor padrão")
	}

	// Configurar rotas
	http.HandleFunc("/", corsMiddleware(helloHandler))
	http.HandleFunc("/health", corsMiddleware(healthHandler))
	http.HandleFunc("/api/metrics", corsMiddleware(verifyTokenMiddleware(metricsHandler)))
	http.HandleFunc("/api/metrics/time-series", corsMiddleware(verifyTokenMiddleware(timeSeriesHandler)))

	fmt.Println("Backend 2 API listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// corsMiddleware adiciona headers CORS às respostas
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Permitir origem do frontend
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Responder a requisições OPTIONS (preflight)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// verifyTokenMiddleware valida o token JWT antes de permitir acesso
func verifyTokenMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Obter token do header Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "Token não fornecido"}`, http.StatusUnauthorized)
			return
		}

		// Formato esperado: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error": "Formato de token inválido. Use: Bearer <token>"}`, http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Verificar e decodificar o token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verificar algoritmo
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("método de assinatura inesperado: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "Token inválido: %v"}`, err), http.StatusUnauthorized)
			return
		}

		if !token.Valid {
			http.Error(w, `{"error": "Token inválido"}`, http.StatusUnauthorized)
			return
		}

		// Token válido, continuar com a requisição
		next(w, r)
	}
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{
		"service": "backend2-api",
		"status":  "running",
		"message": "Hello from Backend 2 (Query API)",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func getDB() (*sql.DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL não configurada")
	}

	// Adicionar sslmode=disable se não estiver presente
	if !strings.Contains(databaseURL, "sslmode") {
		if strings.Contains(databaseURL, "?") {
			databaseURL += "&sslmode=disable"
		} else {
			databaseURL += "?sslmode=disable"
		}
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

// metricsHandler retorna métricas agregadas (valores totais)
func metricsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Obter parâmetros de query
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	paymentMethod := r.URL.Query().Get("payment_method")

	// Conectar ao banco
	db, err := getDB()
	if err != nil {
		http.Error(w, fmt.Sprintf("Erro ao conectar ao banco: %v", err), http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Construir query base
	query := `
		SELECT 
			status,
			SUM(total_orders) as total_orders,
			SUM(total_value) as total_value
		FROM aggregated.daily_metrics
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	// Adicionar filtros
	if startDate != "" {
		query += fmt.Sprintf(" AND date >= $%d", argIndex)
		args = append(args, startDate)
		argIndex++
	}

	if endDate != "" {
		query += fmt.Sprintf(" AND date <= $%d", argIndex)
		args = append(args, endDate)
		argIndex++
	}

	if paymentMethod != "" {
		query += fmt.Sprintf(" AND payment_method = $%d", argIndex)
		args = append(args, paymentMethod)
		argIndex++
	}

	query += " GROUP BY status"

	// Executar query
	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, fmt.Sprintf("Erro ao executar query: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Inicializar métricas
	metrics := MetricsResponse{
		Filters: Filters{
			StartDate:     startDate,
			EndDate:       endDate,
			PaymentMethod: paymentMethod,
		},
		FinancialMetrics:   FinancialMetrics{},
		OperationalMetrics: OperationalMetrics{},
	}

	// Processar resultados
	for rows.Next() {
		var status string
		var totalOrders int
		var totalValue float64

		if err := rows.Scan(&status, &totalOrders, &totalValue); err != nil {
			http.Error(w, fmt.Sprintf("Erro ao ler resultado: %v", err), http.StatusInternalServerError)
			return
		}

		switch status {
		case "approved":
			metrics.FinancialMetrics.ApprovedRevenue = totalValue
			metrics.OperationalMetrics.ApprovedOrders = totalOrders
		case "pending":
			metrics.FinancialMetrics.PendingRevenue = totalValue
			metrics.OperationalMetrics.PendingOrders = totalOrders
		case "cancelled":
			metrics.FinancialMetrics.CancelledRevenue = totalValue
			metrics.OperationalMetrics.CancelledOrders = totalOrders
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// timeSeriesHandler retorna séries temporais para gráficos
func timeSeriesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Obter parâmetros de query
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	paymentMethod := r.URL.Query().Get("payment_method")

	// Conectar ao banco
	db, err := getDB()
	if err != nil {
		http.Error(w, fmt.Sprintf("Erro ao conectar ao banco: %v", err), http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Construir query para séries temporais
	query := `
		SELECT 
			date,
			SUM(CASE WHEN status = 'approved' THEN total_value ELSE 0 END) as approved_revenue,
			SUM(CASE WHEN status = 'pending' THEN total_value ELSE 0 END) as pending_revenue,
			SUM(CASE WHEN status = 'cancelled' THEN total_value ELSE 0 END) as cancelled_revenue,
			SUM(CASE WHEN status = 'approved' THEN total_orders ELSE 0 END) as approved_orders,
			SUM(CASE WHEN status = 'pending' THEN total_orders ELSE 0 END) as pending_orders,
			SUM(CASE WHEN status = 'cancelled' THEN total_orders ELSE 0 END) as cancelled_orders
		FROM aggregated.daily_metrics
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	// Adicionar filtros
	if startDate != "" {
		query += fmt.Sprintf(" AND date >= $%d", argIndex)
		args = append(args, startDate)
		argIndex++
	}

	if endDate != "" {
		query += fmt.Sprintf(" AND date <= $%d", argIndex)
		args = append(args, endDate)
		argIndex++
	}

	if paymentMethod != "" {
		query += fmt.Sprintf(" AND payment_method = $%d", argIndex)
		args = append(args, paymentMethod)
		argIndex++
	}

	query += " GROUP BY date ORDER BY date"

	// Executar query
	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, fmt.Sprintf("Erro ao executar query: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Processar resultados
	var timeSeries []TimeSeriesPoint
	for rows.Next() {
		var point TimeSeriesPoint
		var date time.Time

		err := rows.Scan(
			&date,
			&point.ApprovedRevenue,
			&point.PendingRevenue,
			&point.CancelledRevenue,
			&point.ApprovedOrders,
			&point.PendingOrders,
			&point.CancelledOrders,
		)
		if err != nil {
			http.Error(w, fmt.Sprintf("Erro ao ler resultado: %v", err), http.StatusInternalServerError)
			return
		}

		point.Date = date.Format("2006-01-02")
		timeSeries = append(timeSeries, point)
	}

	// Criar resposta com filtros
	response := TimeSeriesResponse{
		Filters: Filters{
			StartDate:     startDate,
			EndDate:       endDate,
			PaymentMethod: paymentMethod,
		},
		Data: timeSeries,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
