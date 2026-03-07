export type Address = {
  _id: string;
  userId: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
  addressType: 'home' | 'office' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAddressPayload = {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault?: boolean;
  addressType?: 'home' | 'office' | 'other';
  notes?: string;
};

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export type GetAddressResponse = {
  message: string;
  address: Address;
};

export type GetAddressesByUserResponse = {
  message: string;
  addresses: Address[];
};

export type CreateAddressResponse = {
  message: string;
  address: Address;
};

export type UpdateAddressResponse = {
  message: string;
  address: Address;
};

export type DeleteAddressResponse = {
  message: string;
};

export type SetDefaultAddressResponse = {
  message: string;
  address: Address;
};