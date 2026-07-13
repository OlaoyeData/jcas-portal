from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """Shared base for all ORM models."""

    @declared_attr.directive
    def __tablename__(cls) -> str:  # noqa: N805
        # Automatically snake_case the class name as table name
        import re
        name = re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()
        return name
