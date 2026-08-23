from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional, List
import uuid
import os
import aiofiles
from datetime import datetime

from ...schemas.cin import CINExtractionResult, CINData, CINConfidence, DuplicateCheckResult
from ...services.ocr_service import ocr_engine
from ...services.qr_service import generate_lh_id, generate_qr_payload, generate_qr_base64
from ...services.duplicate_service import check_duplicate, register_record, get_all_records
from ...core.config import settings

router = APIRouter()

# Ensure upload dir
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("/extract", response_model=CINExtractionResult)
async def extract_cin(
    front_image: UploadFile = File(..., description="Image recto CIN"),
    back_image: Optional[UploadFile] = File(None, description="Image verso optionnelle"),
    use_mock: bool = Form(False, description="Forcer simulation OCR")
):
    """
    Endpoint principal: Upload image CIN → OCR → Extraction structurée + QR + Duplicate check
    """
    # Validate file type
    if not front_image.content_type or not front_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image (JPG/PNG)")
    
    # Check size
    content = await front_image.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Image trop volumineuse (max 10MB)")
    
    if len(content) < 1000:
        raise HTTPException(status_code=400, detail="Image vide ou corrompue")
    
    try:
        # OCR Extraction
        ocr_result = ocr_engine.extract(content, use_mock=use_mock if use_mock else None)
        fields = ocr_result["fields"]
        raw_text = ocr_result["raw_text"]
        confidence_dict = ocr_result["confidence"]
        
        # Générer LH ID
        lh_id = generate_lh_id()
        
        # Duplicate check
        dup_result = check_duplicate(
            numero_cin=fields["numero_cin"],
            nom=fields["nom"],
            prenoms=fields["prenoms"],
            date_naissance=str(fields["date_naissance"])
        )
        
        # QR Code
        qr_payload = generate_qr_payload(lh_id, fields["numero_cin"], fields["nom"])
        qr_b64 = generate_qr_base64(qr_payload)
        
        # Construire CINData
        cin_data = CINData(
            numero_cin=fields["numero_cin"],
            nom=fields["nom"],
            prenoms=fields["prenoms"],
            date_naissance=fields["date_naissance"],
            lieu_naissance=fields["lieu_naissance"],
            sexe=fields.get("sexe", "M"),
            adresse=fields["adresse"],
            date_emission=fields["date_emission"],
            lieu_emission=fields["lieu_emission"],
            profession=fields.get("profession")
        )
        
        conf = CINConfidence(
            numero_cin=confidence_dict.get("numero_cin", 0.85),
            nom=confidence_dict.get("nom", 0.85),
            prenoms=confidence_dict.get("prenoms", 0.85),
            date_naissance=confidence_dict.get("date_naissance", 0.80),
            lieu_naissance=confidence_dict.get("lieu_naissance", 0.80),
            adresse=confidence_dict.get("adresse", 0.75),
            global_score=confidence_dict.get("global", 0.85)
        )
        
        # Sauvegarder image (optionnel)
        file_id = str(uuid.uuid4())
        ext = front_image.filename.split(".")[-1] if "." in (front_image.filename or "") else "jpg"
        save_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.{ext}")
        try:
            async with aiofiles.open(save_path, "wb") as f:
                await f.write(content)
        except Exception as e:
            print(f"[WARN] Could not save upload: {e}")
            save_path = None
        
        # Construire résultat
        result = CINExtractionResult(
            id=file_id,
            lh_id=lh_id,
            data=cin_data,
            confidence=conf,
            raw_text=raw_text,
            duplicate_of=dup_result.get("existing_id"),
            duplicate_score=dup_result.get("score"),
            image_url=save_path,
            qr_data=qr_payload,
            qr_image_base64=qr_b64,
            created_at=datetime.utcnow()
        )
        
        # Enregistrer en mémoire pour détection doublons future (MVP)
        # En prod, sauvegarder en DB seulement après validation manuelle
        # Ici on enregistre seulement si pas doublon exact pour éviter pollution
        if not dup_result["is_duplicate"] or dup_result.get("type") == "fuzzy_name":
            register_record({
                "id": file_id,
                "lh_id": lh_id,
                "numero_cin": fields["numero_cin"],
                "nom": fields["nom"],
                "prenoms": fields["prenoms"],
                "date_naissance": str(fields["date_naissance"]),
                "qr_data": qr_payload,
                "created_at": datetime.utcnow().isoformat()
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Extraction failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur extraction OCR: {str(e)}")

@router.post("/validate/{record_id}")
async def validate_cin(record_id: str, payload: CINData):
    """
    Validation manuelle après édition par agent
    """
    # Vérifier doublon final
    dup = check_duplicate(payload.numero_cin, payload.nom, payload.prenoms, str(payload.date_naissance))
    
    # Si doublon exact et pas le même ID, refuser ou marquer
    # Pour MVP on accepte mais signale
    
    lh_id = generate_lh_id()
    qr_payload = generate_qr_payload(lh_id, payload.numero_cin, payload.nom)
    qr_b64 = generate_qr_base64(qr_payload)
    
    # Enregistrer définitivement
    register_record({
        "id": record_id,
        "lh_id": lh_id,
        "numero_cin": payload.numero_cin,
        "nom": payload.nom,
        "prenoms": payload.prenoms,
        "date_naissance": str(payload.date_naissance),
        "qr_data": qr_payload,
        "created_at": datetime.utcnow().isoformat()
    })
    
    return {
        "id": record_id,
        "lh_id": lh_id,
        "data": payload,
        "qr_data": qr_payload,
        "qr_image_base64": qr_b64,
        "statut": "validated",
        "duplicate_check": dup,
        "validated_at": datetime.utcnow().isoformat()
    }

@router.get("/records")
async def list_records():
    """Liste tous les enregistrements (MVP in-memory)"""
    records = get_all_records()
    return {
        "total": len(records),
        "records": records
    }

@router.post("/duplicate-check", response_model=DuplicateCheckResult)
async def duplicate_check_endpoint(payload: CINData):
    result = check_duplicate(
        payload.numero_cin,
        payload.nom,
        payload.prenoms,
        str(payload.date_naissance)
    )
    return DuplicateCheckResult(
        is_duplicate=result["is_duplicate"],
        score=result["score"],
        existing_id=result.get("existing_id"),
        existing_lh_id=result.get("existing_lh_id"),
        message=result["message"]
    )

@router.post("/sync/batch")
async def sync_batch(records: List[CINData]):
    """
    Endpoint pour synchronisation offline-first batch
    Reçoit liste de CIN collectées hors-ligne
    """
    results = []
    for rec in records:
        dup = check_duplicate(rec.numero_cin, rec.nom, rec.prenoms, str(rec.date_naissance))
        if not dup["is_duplicate"]:
            lh_id = generate_lh_id()
            register_record({
                "id": str(uuid.uuid4()),
                "lh_id": lh_id,
                "numero_cin": rec.numero_cin,
                "nom": rec.nom,
                "prenoms": rec.prenoms,
                "date_naissance": str(rec.date_naissance),
                "created_at": datetime.utcnow().isoformat()
            })
            results.append({"numero_cin": rec.numero_cin, "status": "synced", "lh_id": lh_id})
        else:
            results.append({"numero_cin": rec.numero_cin, "status": "duplicate", "existing_lh_id": dup.get("existing_lh_id")})
    
    return {
        "synced": len([r for r in results if r["status"] == "synced"]),
        "duplicates": len([r for r in results if r["status"] == "duplicate"]),
        "results": results
    }

@router.get("/health")
async def health():
    from ...services.ocr_service import TESSERACT_AVAILABLE
    return {
        "status": "ok",
        "ocr_engine": "tesseract" if TESSERACT_AVAILABLE else "mock",
        "tesseract_available": TESSERACT_AVAILABLE,
        "records_in_memory": len(get_all_records()),
        "version": settings.VERSION
    }
