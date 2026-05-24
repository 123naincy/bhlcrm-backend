import { Response } from "express";
import LeadSourceMapping from "../../models/source/LeadSourceMapping";

export const createSourceMapping =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const {
        sourceType,
        identifier,
        projectId,
        projectName,
      } = req.body;

      const brandId =
        req.user?.brandId ||
        req.user?.userId;

      if (
        !sourceType ||
        !identifier ||
        !projectId ||
        !projectName
      ) {
        return res.status(400).json({
          message:
            "All fields required",
        });
      }

      const existing =
        await LeadSourceMapping.findOne(
          {
            sourceType,
            identifier,
            brandId,
          }
        );

      if (existing) {
        return res.status(400).json({
          message:
            "Mapping already exists",
        });
      }

      const mapping =
        await LeadSourceMapping.create(
          {
            sourceType,
            identifier,
            projectId,
            projectName,
            brandId,
            createdBy:
              req.user.userId,
          }
        );

      res.status(201).json({
        success: true,
        mapping,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Create mapping failed",
      });
    }
  };

export const getSourceMappings =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const brandId =
        req.user?.brandId ||
        req.user?.userId;

      const mappings =
        await LeadSourceMapping.find(
          {
            brandId,
          }
        )
          .populate(
            "projectId",
            "name"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,
        mappings,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Fetch mappings failed",
      });
    }
  };

export const deleteSourceMapping =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const { id } =
        req.params;

      await LeadSourceMapping.findByIdAndDelete(
        id
      );

      res.status(200).json({
        success: true,
        message:
          "Mapping deleted",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Delete failed",
      });
    }
  };