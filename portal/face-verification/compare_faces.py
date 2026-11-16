
from deepface import DeepFace
import numpy as np
from pathlib import Path


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

    return np.array(embedding)


# compare two numerical templates
def compare_embeddings(embedding1, embedding2):
    similarity = np.dot(embedding1, embedding2) / (
        np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
    )

    distance = 1 - similarity
    threshold = 0.30

    return distance <= threshold, distance

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


if __name__ == "__main__":
    folder = Path(__file__).parent

    compare_faces(
        folder / "registered.png",
        folder / "live.png"
    )
