
from deepface import DeepFace
import numpy as np
from pathlib import Path

from face_storage import save_face_template, load_face_template

THRESHOLD = 0.30

# detect face and convert it to a numerical template
def get_face_embedding(image):
    result = DeepFace.represent(
        img_path=str(image) if isinstance(image, Path) else image,
        model_name="Facenet512",
        detector_backend="opencv",
        enforce_detection=True
    )

    if len(result) != 1:
        raise ValueError("Expected exactly one face.")

    embedding = result[0]["embedding"]

    return np.array(embedding, dtype=float)


# compare two numerical templates
def compare_embeddings(embedding1, embedding2):
    embedding1 = np.asarray(embedding1, dtype=float)
    embedding2 = np.asarray(embedding2, dtype=float)

    if embedding1.shape != (512,) or embedding2.shape != (512,):
        raise ValueError("Expected two 512-dimensional embeddings.")

    if not np.all(np.isfinite(embedding1)) or not np.all(np.isfinite(embedding2)):
        raise ValueError("Embeddings contain invalid numbers.")

    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)

    if norm1 == 0 or norm2 == 0:
        raise ValueError("Cannot compare empty numerical templates.")

    similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)

    distance = 1 - np.clip(similarity, -1, 1)

    return bool(distance <= THRESHOLD), float(distance)


# compare registered face with captured face
def compare_faces(registered_image, live_image):
    try:
        registered_embedding = get_face_embedding(registered_image)
        live_embedding = get_face_embedding(live_image)

        match, distance = compare_embeddings(
            registered_embedding,
            live_embedding
        )

        print("Distance:", distance)

        if match:
            print("MATCH: Faces match!")
        else:
            print("NO MATCH: Different faces!")

        return match

    except Exception as error:
        print("ERROR:", error)
        return False


# compare stored numerical template with captured face
def verify_face(registered_embedding, live_image):
    live_embedding = get_face_embedding(live_image)

    match, distance = compare_embeddings(
        registered_embedding,
        live_embedding
    )

    return match, distance


# generate and save registered face template
def register_face_template(image):
    embedding = get_face_embedding(image)

    template_ref = save_face_template(embedding)

    return template_ref


# compare captured face with saved template
def verify_saved_face(template_ref, live_image):
    registered_embedding = load_face_template(template_ref)

    match, distance = verify_face(
        registered_embedding,
        live_image
    )

    return match, distance

if __name__ == "__main__":
    folder = Path(__file__).parent

    registered_image = folder / "registered.png"
    live_image = folder / "live.png"

    if registered_image.exists() and live_image.exists():
        compare_faces(registered_image, live_image)
    else:
        print("Test images not found. Skipping comparison.")
