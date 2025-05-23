import { ProjectRisk, ProjectRiskModel } from "../models/projectRisk.model";
import { sequelize } from "../database/db";
import {
  ProjectsMembers,
  ProjectsMembersModel,
} from "../models/projectsMembers.model";
import { FileModel } from "../models/file.model";
import { QueryTypes, Transaction } from "sequelize";

export const getProjectRisksReportQuery = async (
  projectId: number
): Promise<ProjectRisk[]> => {
  const projectRisks = await sequelize.query(
    "SELECT * FROM projectrisks WHERE project_id = :project_id ORDER BY created_at DESC, id ASC",
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectRiskModel,
    }
  );
  return projectRisks;
};

export const getMembersByProjectIdQuery = async (
  projectId: number
): Promise<ProjectsMembers[]> => {
  const members = await sequelize.query(
    "SELECT * FROM projects_members WHERE project_id = :project_id",
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectsMembersModel,
    }
  );
  return members;
};

export const getGeneratedReportsQuery = async () => {
  const validSources = [
    "Project risks report",
    "Compliance tracker report",
    "Assessment tracker report",
    "Vendors and risks report",
    "All reports",
  ];
  const query = `
    SELECT 
      report.id, 
      report.filename, 
      report.project_id,  
      report.uploaded_time,
      report.source, 
      p.project_title AS project_title,
      u.name AS uploader_name,
      u.surname AS uploader_surname
    FROM files report
    JOIN projects p ON report.project_id = p.id
    JOIN users u ON report.uploaded_by = u.id
    WHERE report.source IN (:sources)
    ORDER BY uploaded_time DESC, report.id ASC
  `;
  const reports = await sequelize.query(query, {
    replacements: { sources: validSources },
    type: QueryTypes.SELECT,
  });
  return reports;
};

export const deleteReportByIdQuery = async (
  id: number,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    "DELETE FROM files WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: FileModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );

  return result.length > 0;
};

export const getReportByIdQuery = async (id: number) => {
  const result = await sequelize.query(`SELECT * FROM files WHERE id = :id`, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
  });
  return result[0];
};
