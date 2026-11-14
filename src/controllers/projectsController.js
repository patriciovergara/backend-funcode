import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from "../models/projectsModel.js";

export async function getProjects(req, res, next) {
  try {
    const projects = await listProjects();
    return res.status(200).json({ projects });
  } catch (error) {
    return next(error);
  }
}

export async function getProjectsForAdmin(req, res, next) {
  try {
    const projects = await listProjects({ includeUnpublished: true });
    return res.status(200).json({ projects });
  } catch (error) {
    return next(error);
  }
}

export async function createProjectController(req, res, next) {
  try {
    const project = await createProject(req.validatedProject);
    return res.status(201).json({
      message: "Proyecto creado correctamente.",
      project,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe un proyecto con esa URL.",
      });
    }

    return next(error);
  }
}

export async function updateProjectController(req, res, next) {
  try {
    const project = await updateProject(req.projectId, req.validatedProject);

    if (!project) {
      return res.status(404).json({
        message: "Proyecto no encontrado.",
      });
    }

    return res.status(200).json({
      message: "Proyecto actualizado correctamente.",
      project,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe un proyecto con esa URL.",
      });
    }

    return next(error);
  }
}

export async function deleteProjectController(req, res, next) {
  try {
    const deleted = await deleteProject(req.projectId);

    if (!deleted) {
      return res.status(404).json({
        message: "Proyecto no encontrado.",
      });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}
