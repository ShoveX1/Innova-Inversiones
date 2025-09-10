from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

from django.conf import settings
from django.utils.timezone import now
from database.models import Lote


def _get_snapshot_dir() -> Path:
    base_dir: Path = settings.BASE_DIR  # type: ignore[assignment]
    snapshot_dir = base_dir / "data"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    return snapshot_dir


def _get_snapshot_path() -> Path:
    return _get_snapshot_dir() / "lotes_snapshot.json"


def build_lotes_payload() -> Dict[str, Any]:
    lotes_data = Lote.objects.select_related("estado").values(
        "codigo",
        "manzana",
        "lote_numero",
        "estado__id",
        "estado__nombre",
        "area_lote",
        "perimetro",
        "precio",
    )

    data = [
        {
            "codigo": lote["codigo"].lower(),
            "manzana": str(lote["manzana"]),
            "lote_numero": lote["lote_numero"],
            "estado": str(lote["estado__id"]),
            "estado_nombre": lote["estado__nombre"],
            "area_lote": float(lote["area_lote"]),
            "perimetro": float(lote["perimetro"]),
            "precio": float(lote["precio"]) if lote["precio"] is not None else None,
        }
        for lote in lotes_data
    ]

    return {
        "updated_at": now().isoformat(),
        "version": 1,
        "data": data,
    }


def write_snapshot(payload: Dict[str, Any]) -> None:
    target = _get_snapshot_path()
    tmp_path = target.with_suffix(".tmp")
    with tmp_path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False)
    tmp_path.replace(target)


def read_snapshot() -> Optional[Dict[str, Any]]:
    target = _get_snapshot_path()
    if not target.exists():
        return None
    try:
        with target.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return None


def refresh_snapshot() -> Dict[str, Any]:
    payload = build_lotes_payload()
    write_snapshot(payload)
    return payload


