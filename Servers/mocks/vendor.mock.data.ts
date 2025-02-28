import { Vendor } from "../models/vendor.model";

export const vendors = [
  {
    id: 1,
    vendorName: "Vendor A",
    assignee: "John Doe",
    vendorProvides: "Consulting Services",
    website: "www.vendora.com",
    vendorContactPerson: "Jane Smith",
    reviewResult: "Positive",
    reviewStatus: "Completed",
    reviewer: "Bob Johnson",
    riskStatus: "Not active",
    reviewDate: new Date("2023-05-15"),
    riskDescription: "Limited experience with new technology",
    impactDescription: "Potential delays in project timeline",
    impact: 3,
    probability: 0.4,
    actionOwner: "Alice Williams",
    actionPlan: "Provide additional training",
    riskSeverity: 2,
    riskLevel: "Low risk",
    likelihood: 0.5,
  },
  {
    id: 2,
    vendorName: "Vendor B",
    assignee: "Emily Clark",
    vendorProvides: "Software Development",
    website: "www.vendorb.com",
    vendorContactPerson: "Michael Brown",
    reviewResult: "Neutral",
    reviewStatus: "In Progress",
    reviewer: "Sarah Davis",
    riskStatus: "Under review",
    reviewDate: new Date("2023-06-20"),
    riskDescription: "High turnover rate",
    impactDescription: "Possible disruption in service",
    impact: 4,
    probability: 0.6,
    actionOwner: "David Wilson",
    actionPlan: "Implement retention strategies",
    riskSeverity: 3,
    riskLevel: "Medium risk",
    likelihood: 0.6,
  },
  {
    id: 3,
    vendorName: "Vendor C",
    assignee: "James White",
    vendorProvides: "IT Support",
    website: "www.vendorc.com",
    vendorContactPerson: "Laura Green",
    reviewResult: "Negative",
    reviewStatus: "Pending",
    reviewer: "Chris Martin",
    riskStatus: "Active",
    reviewDate: new Date("2023-07-10"),
    riskDescription: "Lack of expertise in critical areas",
    impactDescription: "Significant impact on project quality",
    impact: 5,
    probability: 0.8,
    actionOwner: "Patricia Taylor",
    actionPlan: "Hire additional experts",
    riskSeverity: 4,
    riskLevel: "High risk",
    likelihood: 0.7,
  },
  {
    id: 4,
    vendorName: "Vendor D",
    assignee: "Olivia Harris",
    vendorProvides: "Marketing Services",
    website: "www.vendord.com",
    vendorContactPerson: "Ethan Lewis",
    reviewResult: "Positive",
    reviewStatus: "Completed",
    reviewer: "Sophia Walker",
    riskStatus: "Not active",
    reviewDate: new Date("2023-08-01"),
    riskDescription: "Limited market reach",
    impactDescription: "Reduced campaign effectiveness",
    impact: 2,
    probability: 0.3,
    actionOwner: "Liam Robinson",
    actionPlan: "Expand market research",
    riskSeverity: 1,
    riskLevel: "Low risk",
    likelihood: 0.4,
  },
];
