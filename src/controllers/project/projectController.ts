import { Request, Response } from "express";
import Project from "../../models/project/Project";

export const createProject = async (
  req: any,
  res: Response
) => {
  try {
    const {
      name,
      location,
      propertyType,
      description,
    } = req.body;

    const brandId =
      req.user?.brandId ||
      req.user?.userId;

    if (!name) {
      return res.status(400).json({
        message:
          "Project name required",
      });
    }

    const existing =
      await Project.findOne({
        name,
        brandId,
      });

    if (existing) {
      return res.status(400).json({
        message:
          "Project already exists",
      });
    }

    const project =
      await Project.create({
        name,
        location,
        propertyType,
        description,
        brandId,
        createdBy:
          req.user.userId,
      });

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Create project failed",
    });
  }
};

export const getProjects =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const brandId =
        req.user?.brandId ||
        req.user?.userId;

      const projects =
        await Project.find({
          brandId,
        }).sort({
          createdAt: -1,
        });

      res.status(200).json({
        success: true,
        projects,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Fetch projects failed",
      });
    }
  };

export const updateProject =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } = req.params;

      const project =
        await Project.findByIdAndUpdate(
          id,
          req.body,
          { new: true }
        );

      if (!project) {
        return res.status(404).json({
          message:
            "Project not found",
        });
      }

      res.status(200).json({
        success: true,
        project,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Update failed",
      });
    }
  };

export const deleteProject =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } = req.params;

      await Project.findByIdAndDelete(
        id
      );

      res.status(200).json({
        success: true,
        message:
          "Project deleted",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Delete failed",
      });
    }
  };