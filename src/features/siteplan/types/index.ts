export interface SitePlan {
  id: string;
  approvalNo: string;
  submissionNo: string;
  housingName: string;
  developerName: string;
  landArea: number;
  approvedDate: string;
  documentUrl: string;
  coordinates: {
    lat: number;
    lng: number;
    polygon: [number, number][];
  };
}
