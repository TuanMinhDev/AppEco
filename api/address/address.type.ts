export type AddressType = 'home' | 'office' | 'warehouse';

export interface IAddress {
  _id: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
  type: AddressType;
}

export interface CreateAddressPayload {
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault?: boolean;
  type?: AddressType;
}
