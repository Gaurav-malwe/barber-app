import os


def handler(event, context):
    from alembic import command
    from alembic.config import Config

    config_path = os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
    config = Config(os.path.abspath(config_path))
    migrations_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "alembic_migrations")
    )
    config.set_main_option("script_location", migrations_path)
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        config.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(config, "head")
    return {"status": "ok"}
