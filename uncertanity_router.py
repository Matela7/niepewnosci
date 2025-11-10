from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

import uncertanity_service as service
from uncertanity_model import UncertanityRequest


router = APIRouter(prefix="/api", tags=["uncertainty"])


@router.post("/uncertanity")
def compute_uncertanity(payload: UncertanityRequest):
    try:
        # uncertanity_ua zwraca tuple: (u_a, u_a_ingredients, sum_of_squares)
        u_a, u_a_ingredients, sum_of_squares = service.uncertanity_ua(payload.scores)
        u_b = None
        
        # Oblicz średnią
        import numpy as np
        mean = float(np.mean(payload.scores))

        if payload.device_uncertanity is not None:
            u_b = service.uncertanity_ub(payload.device_uncertanity)

        u_c = service.uncertanity_c(u_a, u_b) if u_b is not None else u_a

        return {
            "u_a": float(u_a),
            "u_b": float(u_b) if u_b is not None else None,
            "u_c": float(u_c),
            "u_a_ingredients": u_a_ingredients.tolist(),  # Konwersja numpy array do listy
            "sum_of_squares": float(sum_of_squares),
            "mean": mean,
            "n": len(payload.scores)
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected error") from exc
