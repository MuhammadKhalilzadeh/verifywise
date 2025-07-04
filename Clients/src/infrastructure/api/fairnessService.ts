import CustomAxios from "./customAxios";

interface FairnessUploadPayload {
  model: File;
  data: File;
  target_column: string;
  sensitive_column: string;
}

export const fairnessService = {
  /**
   * Uploads model and dataset files to the fairness backend.
   */
  async uploadFairnessFiles(payload: FairnessUploadPayload): Promise<any> {
    const formData = new FormData();
    formData.append("model", payload.model);
    formData.append("data", payload.data);
    formData.append("target_column", payload.target_column);
    formData.append("sensitive_column", payload.sensitive_column);

    const response = await CustomAxios.post("/bias_and_fairness/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Fetches fairness metrics by ID.
   */
  async getFairnessMetrics(id: string): Promise<any> {
    const response = await CustomAxios.get(`/bias_and_fairness/metrics/${id}`);
  
    // Parses stringified JSON if needed
    const raw = response.data;
    const parsed = typeof raw.metrics === "string" ? JSON.parse(raw.metrics) : raw.metrics;
    return parsed;
  },

  /**
   * Fetches all fairness metrics metadata.
   */
  async getAllFairnessMetrics(): Promise<any[]> {
    const response = await CustomAxios.get("/bias_and_fairness/metrics/all");
    return response.data;
  },

  /**
   * Deletes a fairness metric.
   * @param id number type representing metric id
   */
  async deleteFairnessCheck(id: number): Promise<void> {
    await CustomAxios.delete(`/bias_and_fairness/metrics/${id}`);
  }
  

};