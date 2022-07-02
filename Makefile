.PHONY: lint
.DEFAULT_GOAL=dist
PACKAGE_MANAGER=yarn

node_modules: package.json yarn.lock ## Installer les dépendances
	$(PACKAGE_MANAGER) install

dist: node_modules src tsconfig.json ## Construire les fichiers de distribution
	npm run build

lint: node_modules .eslintrc .eslintignore ## Analyse statique du code
	npm run lint

README.md: dist ## Construire le fichier de description du module
	npm run doc
