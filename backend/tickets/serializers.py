from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for creating and listing tickets."""

    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class TicketUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partial updates (status change, override category/priority)."""

    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "title": {"required": False},
            "description": {"required": False},
            "category": {"required": False},
            "priority": {"required": False},
            "status": {"required": False},
        }


class ClassifySerializer(serializers.Serializer):
    """Serializer for the LLM classification endpoint."""
    description = serializers.CharField(required=True)


class StatsSerializer(serializers.Serializer):
    """Read-only serializer for the stats endpoint response."""
    total_tickets = serializers.IntegerField()
    open_tickets = serializers.IntegerField()
    avg_tickets_per_day = serializers.FloatField()
    priority_breakdown = serializers.DictField()
    category_breakdown = serializers.DictField()
