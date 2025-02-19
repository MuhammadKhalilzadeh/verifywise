/*

This is the new Vendor model(Schema) and will be replaced with the new one.
Please align other files with this

*/
export type Vendor = {
  id?: number; // auto generated by database
  order_no?: number; // gets assigned from the structure
  projects: any[]; // won't get any values, will be filled by user
  vendor_name: string; // won't get any values, will be filled by user
  vendor_provides: string; // won't get any values, will be filled by user
  assignee: string; // won't get any values, will be filled by user
  website: string; // won't get any values, will be filled by user
  vendor_contact_person: string; // won't get any values, will be filled by user
  review_result: string; // won't get any values, will be filled by user
  review_status: "Active" | "Under review" | "Not active"; // won't get any values, will be filled by user
  reviewer: string; // won't get any values, will be filled by user
  risk_status:
  | "Very high risk"
  | "High risk"
  | "Medium risk"
  | "Low risk"
  | "Very low risk"; // won't get any values, will be filled by user
  review_date: Date; // won't get any values, will be filled by user
};

// export type Vendor = {
//   id: number;
//   // Vendor details tab
//   vendorName: string;
//   website: string;
//   vendorProvides: string;
//   vendorContactPerson: string;
//   reviewStatus: string;
//   reviewer: string;
//   reviewResult: string;
//   riskStatus: "Active" | "Under review" | "Not active";
//   assignee: string;
//   reviewDate: Date;
//   // Risks tab
//   riskDescription: string;
//   impactDescription: string;
//   impact: number;
//   probability: number;
//   riskSeverity: number;
//   actionOwner: string;
//   actionPlan: string;
//   riskLevel:
//     | "Very high risk"
//     | "High risk"
//     | "Medium risk"
//     | "Low risk"
//     | "Very low risk";
//   likelihood: number;
// };
