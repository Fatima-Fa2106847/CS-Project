
print("FACE STORAGE SCRIPT IS RUNNING")

import json
import numpy as np
from pathlib import Path
from uuid import uuid4


Template_Folder = Path(__file__).resolve().parent.parent / "private_face_templates"


# save numerical face template
def save_face_template(embedding):
    embedding = np.asarray(embedding, dtype=float)

    if embedding.shape != (512,) or not np.all(np.isfinite(embedding)):
        raise ValueError("Invalid face template.")

    Template_Folder .mkdir(parents=True, exist_ok=True)
    template_ref = f"{uuid4().hex}.json"
    template_path = Template_Folder / template_ref

    with open(template_path, "x", encoding="utf-8") as file:
        json.dump(embedding.tolist(), file)

    return template_ref


# load numerical face template
def load_face_template(template_ref):
    if not isinstance(template_ref, str) or not template_ref:
        raise ValueError("Invalid template reference.")

    template_path = Template_Folder  / template_ref

    if template_path.name != template_ref or template_path.suffix != ".json":
        raise ValueError("Invalid template reference.")

    with open(template_path, "r", encoding="utf-8") as file:
        embedding = json.load(file)

    embedding = np.asarray(embedding, dtype=float)

    if embedding.shape != (512,) or not np.all(np.isfinite(embedding)):
        raise ValueError("Invalid stored face template.")

    return embedding

if __name__ == "__main__":
    test_embedding = np.random.rand(512)

    template_ref = save_face_template(test_embedding)
    print("Saved template:", template_ref)

    loaded_embedding = load_face_template(template_ref)
    print("Loaded successfully:", np.array_equal(test_embedding, loaded_embedding))
