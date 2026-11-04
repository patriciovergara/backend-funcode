import {
  createServiceRequest,
  postExists,
} from "../models/serviceRequestsModel.js";

export async function createServiceRequestController(req, res) {
  try {
    const data = req.validatedServiceRequest;

    const exists = await postExists(data.post_id);

    if (!exists) {
      return res.status(404).json({
        error: "El servicio solicitado no existe.",
      });
    }

    const userId = req.user?.id ?? null;

    const request = await createServiceRequest({
      userId,
      postId: data.post_id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      message: data.message,
    });

    return res.status(201).json({
      request,
    });
  } catch (error) {
    console.error("Error al crear la solicitud de servicio:", error);

    return res.status(500).json({
      error: "No pudimos registrar tu solicitud. Inténtalo nuevamente.",
    });
  }
}