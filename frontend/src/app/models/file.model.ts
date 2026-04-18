export interface File {
  id: number;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  owner: User;
  isPublic: boolean;
  description: string;
  uploadedAt: string;
}

export interface AccessRequest {
  id: number;
  requester: User;
  file: File;
  owner: User;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
  requestedAt: string;
  respondedAt?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}