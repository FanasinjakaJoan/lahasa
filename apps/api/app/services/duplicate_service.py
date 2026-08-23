"""
Détection de doublons - exact + fuzzy
"""
import re
from typing import List, Optional, Dict, Any
from rapidfuzz import fuzz

# In-memory store pour MVP (remplacer par DB query en prod)
# Structure: {normalized_cin: record}
_in_memory_store: Dict[str, Dict[str, Any]] = {}

def normalize_cin(numero: str) -> str:
    return re.sub(r'\D', '', numero)

def normalize_name(name: str) -> str:
    return re.sub(r'\s+', ' ', name.strip().upper())

def check_duplicate(numero_cin: str, nom: str, prenoms: str, date_naissance: str) -> Dict[str, Any]:
    """
    Vérifie doublon:
    1. Exact match sur numero_cin (12 chiffres)
    2. Fuzzy match nom+prenoms+date_naissance > 85%
    """
    norm_cin = normalize_cin(numero_cin)
    
    # Check exact CIN
    if norm_cin in _in_memory_store:
        existing = _in_memory_store[norm_cin]
        return {
            "is_duplicate": True,
            "score": 1.0,
            "existing_id": existing.get("id"),
            "existing_lh_id": existing.get("lh_id"),
            "message": f"CIN {numero_cin} déjà enregistrée (LH {existing.get('lh_id')})",
            "type": "exact_cin"
        }
    
    # Check fuzzy sur tous les enregistrements
    norm_nom = normalize_name(nom)
    norm_prenoms = normalize_name(prenoms)
    best_score = 0
    best_match = None
    
    for existing_cin, existing in _in_memory_store.items():
        existing_nom = normalize_name(existing.get("nom", ""))
        existing_prenoms = normalize_name(existing.get("prenoms", ""))
        
        score_nom = fuzz.ratio(norm_nom, existing_nom)
        score_prenoms = fuzz.ratio(norm_prenoms, existing_prenoms)
        # Pondération: nom 40%, prenoms 40%, date 20% (si fournie)
        combined = (score_nom * 0.4 + score_prenoms * 0.4)
        
        # Bonus si même date naissance
        if str(existing.get("date_naissance")) == str(date_naissance):
            combined += 20
        
        if combined > best_score:
            best_score = combined
            best_match = existing
    
    if best_score >= 85:
        return {
            "is_duplicate": True,
            "score": round(best_score / 100, 2),
            "existing_id": best_match.get("id"),
            "existing_lh_id": best_match.get("lh_id"),
            "message": f"Doublon potentiel: {best_score:.0f}% similaire à {best_match.get('nom')} {best_match.get('prenoms')}",
            "type": "fuzzy_name"
        }
    
    return {
        "is_duplicate": False,
        "score": round(best_score / 100, 2),
        "existing_id": None,
        "existing_lh_id": None,
        "message": "Aucun doublon détecté",
        "type": "none"
    }

def register_record(record: Dict[str, Any]):
    """Enregistre en mémoire pour détection future (MVP)"""
    norm = normalize_cin(record.get("numero_cin", ""))
    if norm:
        _in_memory_store[norm] = record

def get_all_records() -> List[Dict[str, Any]]:
    return list(_in_memory_store.values())

def clear_store():
    _in_memory_store.clear()
