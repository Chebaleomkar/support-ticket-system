from django.db.models import Count, Q, Min
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Ticket
from .serializers import (
    TicketSerializer,
    TicketUpdateSerializer,
    ClassifySerializer,
)
from .llm_service import classify_ticket


class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Ticket CRUD operations.

    Endpoints:
        GET    /api/tickets/          — List all tickets (newest first), with filters
        POST   /api/tickets/          — Create a new ticket
        PATCH  /api/tickets/<id>/     — Partial update (status, category, priority)
        GET    /api/tickets/stats/    — Aggregated statistics
        POST   /api/tickets/classify/ — LLM-based classification
    """

    queryset = Ticket.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "priority", "status"]
    search_fields = ["title", "description"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return TicketUpdateSerializer
        return TicketSerializer

    def create(self, request, *args, **kwargs):
        """Create a new ticket. Returns 201 on success."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        Return aggregated ticket statistics using DB-level aggregation.
        No Python loops — uses Django ORM aggregate() and annotate().
        """
        tickets = Ticket.objects.all()

        # Total and open counts via DB aggregation
        total_tickets = tickets.count()
        open_tickets = tickets.filter(status="open").count()

        # Average tickets per day — calculated from first ticket date
        if total_tickets > 0:
            earliest = tickets.aggregate(earliest=Min("created_at"))["earliest"]
            if earliest:
                days_span = (timezone.now() - earliest).days or 1  # avoid division by zero
                avg_per_day = round(total_tickets / days_span, 1)
            else:
                avg_per_day = 0.0
        else:
            avg_per_day = 0.0

        # Priority breakdown via DB-level aggregation
        priority_agg = tickets.values("priority").annotate(count=Count("id"))
        priority_breakdown = {
            p: 0 for p in ["low", "medium", "high", "critical"]
        }
        for item in priority_agg:
            priority_breakdown[item["priority"]] = item["count"]

        # Category breakdown via DB-level aggregation
        category_agg = tickets.values("category").annotate(count=Count("id"))
        category_breakdown = {
            c: 0 for c in ["billing", "technical", "account", "general"]
        }
        for item in category_agg:
            category_breakdown[item["category"]] = item["count"]

        return Response({
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "avg_tickets_per_day": avg_per_day,
            "priority_breakdown": priority_breakdown,
            "category_breakdown": category_breakdown,
        })

    @action(detail=False, methods=["post"], url_path="classify")
    def classify(self, request):
        """
        Send a ticket description to the LLM for auto-classification.
        Returns suggested category and priority.
        """
        serializer = ClassifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        description = serializer.validated_data["description"]
        result = classify_ticket(description)

        return Response(result, status=status.HTTP_200_OK)
