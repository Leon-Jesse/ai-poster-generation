# Variables
BINARY_NAME=auradraw-backend
BUILD_DIR=build_dist
SCRIPTS_DIR=scripts

.PHONY: all build clean run generate

all: build

generate:
	@echo "Generating GORM models..."
	@go run ./cmd/generate/main.go
	@echo "Generation complete."

build:
	@echo "Building backend..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/auradraw
	@echo "Copying configuration and scripts..."
	@cp .env $(BUILD_DIR)/.env 2>/dev/null || echo "No .env found, skipping."
	@mkdir -p $(BUILD_DIR)/config
	@cp config/email_templates.yaml $(BUILD_DIR)/config/email_templates.yaml
	@cp $(SCRIPTS_DIR)/start.sh $(BUILD_DIR)/start.sh
	@chmod +x $(BUILD_DIR)/start.sh
	@echo "Build complete. Artifacts in $(BUILD_DIR)/"

clean:
	@echo "Cleaning build directory..."
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete."

stop:
	@echo "Starting application..."
	@cd $(BUILD_DIR) && ./start.sh stop

run: build
	@echo "Running application..."
	@cd $(BUILD_DIR) && ./start.sh start
