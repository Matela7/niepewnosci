from typing import Sequence
from pydantic import BaseModel

class UncertanityRequest(BaseModel):
    scores: Sequence[float]
    device_uncertanity: float | None = None
