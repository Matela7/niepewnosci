from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

import uncertanity_service as service
from uncertanity_model import UncertanityRequest


router = APIRouter(prefix="/api", tags=["uncertainty"])


@router.post("/uncertanity")
def compute_uncertanity(payload: UncertanityRequest):
    try:
        u_a = service.uncertanity_ua(payload.scores)
        u_b = None

        if payload.device_uncertanity is not None:
            u_b = service.uncertanity_ub(payload.device_uncertanity)

        u_c = service.uncertanity_c(u_a, u_b) if u_b is not None else u_a

        return {"u_a": u_a, "u_b": u_b, "u_c": u_c}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected error") from exc
