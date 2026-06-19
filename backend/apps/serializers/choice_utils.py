from rest_framework.serializers import ValidationError

def normalize_choice_label(value, choices, error_message):
    text = (value or "").strip()
    valid_values = {choice_value for choice_value, _ in choices}
    if text in valid_values:
        return text

    normalized = text.casefold()
    for choice_value, choice_label in choices:
        if normalized == str(choice_label).casefold():
            return choice_value

    raise ValidationError(error_message)