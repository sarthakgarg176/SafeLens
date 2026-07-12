import imagehash
from PIL import Image

def compare_hashes(hash1: str, hash2: str, threshold: int = 10) -> dict:
    h1 = imagehash.hex_to_hash(hash1)
    h2 = imagehash.hex_to_hash(hash2)
    distance = h1 - h2
    similarity = max(0, 100 - (distance * 100 // 64))
    return {
        "distance": distance,
        "similarity": similarity,
        "is_match": distance <= threshold
    }

def find_similar_assets(new_image_path: str, stored_assets: list, threshold: int = 10) -> list:
    img = Image.open(new_image_path)
    new_phash = str(imagehash.phash(img))
    new_whash = str(imagehash.whash(img))
    
    matches = []
    for asset in stored_assets:
        if asset.phash:
            result = compare_hashes(new_phash, asset.phash, threshold)
            if result["is_match"]:
                matches.append({
                    "asset_id": asset.id,
                    "filename": asset.filename,
                    "similarity": result["similarity"],
                    "distance": result["distance"]
                })
    return matches