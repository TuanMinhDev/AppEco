export interface User {
  _id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetMeResponse {
  _id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
