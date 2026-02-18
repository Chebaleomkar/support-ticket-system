"""
LLM Service — uses Groq (Meta LLaMA 3.3 70B) to classify support tickets.

Choice rationale:
- Groq provides extremely fast inference (sub-second latency) for LLaMA models.
- Meta LLaMA 3.3 70B Versatile offers excellent instruction-following for structured output.
- Free tier is generous enough for development and demo purposes.
- The prompt is designed to return strict JSON with only valid enum values.
- Graceful fallback: if the LLM fails for any reason, we return sensible defaults
  so ticket submission is never blocked.
"""

import json
import logging
import re

from django.conf import settings

logger = logging.getLogger(__name__)

# Valid values — must match the model's choices exactly
VALID_CATEGORIES = {"billing", "technical", "account", "general"}
VALID_PRIORITIES = {"low", "medium", "high", "critical"}

# The classification prompt — designed for reliable, structured output
CLASSIFICATION_PROMPT = """You are a support ticket classifier for a software company.

Given a user's support ticket description, you must determine:
1. **category** — one of: billing, technical, account, general
2. **priority** — one of: low, medium, high, critical

Classification guidelines:
- **billing**: payments, invoices, charges, refunds, subscriptions, pricing
- **technical**: bugs, errors, crashes, performance issues, feature requests, integrations
- **account**: login issues, password resets, profile changes, account access, permissions
- **general**: questions, feedback, suggestions, anything that doesn't fit above

Priority guidelines:
- **critical**: system down, data loss, security breach, complete inability to use product
- **high**: major feature broken, significant impact on workflow, urgent deadlines
- **medium**: moderate inconvenience, partial functionality loss, non-urgent issues
- **low**: minor cosmetic issues, general questions, feature requests, nice-to-haves

Respond with ONLY valid JSON (no markdown, no explanation):
{"suggested_category": "<category>", "suggested_priority": "<priority>"}
"""


def classify_ticket(description: str) -> dict:
    """
    Classify a support ticket description using Groq (Meta LLaMA 3.3 70B).

    Returns:
        dict with 'suggested_category' and 'suggested_priority'

    On any failure, returns default values so ticket creation is never blocked.
    """
    api_key = settings.LLM_API_KEY

    if not api_key:
        logger.warning("LLM_API_KEY not configured — returning defaults")
        return {
            "suggested_category": "general",
            "suggested_priority": "medium",
        }

    try:
        from groq import Groq

        client = Groq(api_key=api_key)

        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": CLASSIFICATION_PROMPT,
                },
                {
                    "role": "user",
                    "content": f"Classify this support ticket:\n\n\"{description}\"",
                },
            ],
            temperature=0.1,  # Low temperature for consistent classification
            max_tokens=100,
            response_format={"type": "json_object"},
        )

        raw_text = chat_completion.choices[0].message.content.strip()

        # Strip markdown code fences if present
        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text)

        result = json.loads(raw_text)

        # Validate and sanitize
        category = result.get("suggested_category", "general").lower()
        priority = result.get("suggested_priority", "medium").lower()

        if category not in VALID_CATEGORIES:
            logger.warning(f"LLM returned invalid category '{category}', defaulting to 'general'")
            category = "general"

        if priority not in VALID_PRIORITIES:
            logger.warning(f"LLM returned invalid priority '{priority}', defaulting to 'medium'")
            priority = "medium"

        return {
            "suggested_category": category,
            "suggested_priority": priority,
        }

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
    except Exception as e:
        logger.error(f"LLM classification failed: {e}")

    # Graceful fallback — never block ticket submission
    return {
        "suggested_category": "general",
        "suggested_priority": "medium",
    }
