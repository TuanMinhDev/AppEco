export type AddressType = 'home' | 'office' | 'warehouse';

export interface IAddress {
  _id: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  ward: string;
  street: string;
  isDefault: boolean;
  type: AddressType;
  /** Optional — tương thích dữ liệu cũ */
  district?: string;
}

export interface CreateAddressPayload {
  fullName: string;
  phoneNumber: string;
  province: string;
  ward: string;
  street: string;
  isDefault?: boolean;
  type?: AddressType;
  district?: string;
}
