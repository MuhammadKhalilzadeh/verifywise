import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewSubcontrolQuery,
  deleteSubcontrolByIdQuery,
  getAllSubcontrolsQuery,
  getSubcontrolByIdQuery,
  updateSubcontrolByIdQuery,
} from "../utils/subControl.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";

export async function getAllSubcontrols(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subcontrols = await getAllSubcontrolsQuery();

    if (subcontrols) {
      return res.status(200).json(STATUS_CODE[200](subcontrols));
    }

    return res.status(204).json(STATUS_CODE[204](subcontrols));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subcontrolId = parseInt(req.params.id);

    const subcontrol = await getSubcontrolByIdQuery(subcontrolId);

    if (subcontrol) {
      return res.status(200).json(STATUS_CODE[200](subcontrol));
    }

    return res.status(204).json(STATUS_CODE[204](subcontrol));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewSubcontrol(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  try {
    const subcontrol: {
      controlId: number;
      status: string;
      approver: string;
      riskReview: string;
      owner: string;
      reviewer: string;
      dueDate: Date;
      implementationDetails: string;
      evidence: string;
      feedback: string;
    } = req.body;

    const controlIdFK = req.body.controlId;
    const newSubcontrol = await createNewSubcontrolQuery(
      controlIdFK,
      subcontrol,
      (
        req.files as {
          [key: string]: UploadedFile[];
        }
      ).evidenceFiles,
      (
        req.files as {
          [key: string]: UploadedFile[];
        }
      ).feedbackFiles
    );

    if (newSubcontrol) {
      return res.status(200).json(STATUS_CODE[200](newSubcontrol));
    }

    return res.status(204).json(STATUS_CODE[204](newSubcontrol));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subcontrolId = parseInt(req.params.id);
    const subcontrol: Partial<{
      controlId: number;
      status: string;
      approver: string;
      riskReview: string;
      owner: string;
      reviewer: string;
      dueDate: Date;
      implementationDetails: string;
      evidence: string;
      attachment: string;
      feedback: string;
    }> = req.body;

    const updatedSubcontrol = await updateSubcontrolByIdQuery(
      subcontrolId,
      subcontrol
    );

    if (updatedSubcontrol) {
      return res.status(200).json(STATUS_CODE[200](updatedSubcontrol));
    }

    return res.status(204).json(STATUS_CODE[204](updatedSubcontrol));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subcontrolId = parseInt(req.params.id);

    const deletedSubcontrol = await deleteSubcontrolByIdQuery(subcontrolId);

    if (deletedSubcontrol) {
      return res.status(200).json(STATUS_CODE[200](deletedSubcontrol));
    }

    return res.status(204).json(STATUS_CODE[204](deletedSubcontrol));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
