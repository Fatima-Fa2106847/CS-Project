from deepface import DeepFace

def compare_faces(registered_image, live_image):
    try:
        result = DeepFace.verify(
              img1_path=registered_image, img2_path=live_image, model_name="Facenet512",detector_backend="opencv",
                                 enforce_detection=True
                                 )
        if result["verified"]:
            print("MATCH: Identity verified!")
        else:
            print("NO MATCH: Different person!")


    except Exception as error:
        print("ERROR:", error)
     


compare_faces("portal/face-verification/registered.png","portal/face-verification/live.png")