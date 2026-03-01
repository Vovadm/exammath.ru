lint:
	black . --check
	isort . --check-only
	flake8 .
	cd .. && mypy backend

test:
	pytest tests --asyncio-mode=auto
