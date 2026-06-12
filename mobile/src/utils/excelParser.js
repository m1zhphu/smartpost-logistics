import * as XLSX from 'xlsx';

const COLUMN_MAPPING = {
  shop_order_code: ['ma don hang shop', 'mã đơn hàng shop', 'ma don hang', 'mã đơn hàng'],
  sender_name: ['ten nguoi gui', 'tên người gửi', 'nguoi gui', 'người gửi'],
  sender_phone: ['so dien thoai nguoi gui', 'số điện thoại người gửi', 'sdt nguoi gui', 'sđt người gửi'],
  sender_address: ['dia chi nguoi gui', 'địa chỉ người gửi'],
  sender_province: ['tinh gui', 'tỉnh gửi'],
  service_type: ['dich vu', 'dịch vụ'],
  extra_services: ['dich vu cong them', 'dịch vụ cộng thêm', 'dvct'],
  receiver_name: ['ho ten nguoi nhan', 'họ tên người nhận', 'ten nguoi nhan', 'tên người nhận', 'nguoi nhan', 'người nhận'],
  receiver_phone: ['so dien thoai nguoi nhan', 'số điện thoại người nhận', 'sdt nguoi nhan', 'sđt người nhận'],
  receiver_address: ['dia chi giao hang', 'địa chỉ giao hàng', 'dia chi nguoi nhan', 'địa chỉ người nhận'],
  receiver_province: ['tinh den', 'tỉnh đến', 'tinh nhan', 'tỉnh nhận'],
  product_group: ['nhom hang hoa', 'nhóm hàng hóa', 'loai hang', 'loại hàng', 'loai hang hoa', 'loại hàng hóa'],
  product_name: ['ten hang hoa', 'tên hàng hóa', 'ten san pham', 'tên sản phẩm'],
  declared_value: ['gia tri hang hoa', 'giá trị hàng hóa', 'gía trị hàng hóa', 'khai gia', 'khai giá'],
  weight: ['khoi luong [kg]', 'khối lượng [kg]', 'khoi luong', 'khối lượng'],
  length: ['dai [cm]', 'dài [cm]', 'dai', 'dài'],
  width: ['rong [cm]', 'rộng [cm]', 'rong', 'rộng'],
  height: ['cao [cm]', 'cao [cm]', 'cao', 'cao'],
  quantity: ['so luong', 'số lượng'],
  payment_method: ['hinh thuc thanh toan', 'hình thức thanh toán'],
  cod_amount: ['tien thu ho cod', 'tiền thu hộ cod', 'thu ho cod', 'thu hộ cod', 'cod']
};

export const parseVietnameseAddress = (addressStr, fallbackProvinceName) => {
  let provinceName = '';
  let districtName = '';
  let wardName = '';
  let addressDetail = addressStr || '';

  if (addressStr) {
    const parts = addressStr.split(',').map(p => p.trim());
    if (parts.length >= 4) {
      provinceName = parts[parts.length - 1];
      districtName = parts[parts.length - 2];
      wardName = parts[parts.length - 3];
      addressDetail = parts.slice(0, parts.length - 3).join(', ');
    } else if (parts.length === 3) {
      provinceName = parts[parts.length - 1];
      districtName = parts[parts.length - 2];
      addressDetail = parts.slice(0, parts.length - 2).join(', ');
    } else if (parts.length === 2) {
      provinceName = parts[parts.length - 1];
      addressDetail = parts[0];
    }
  }

  if (!provinceName && fallbackProvinceName) {
    provinceName = fallbackProvinceName;
  }

  return {
    province_name: provinceName,
    district_name: districtName,
    ward_name: wardName,
    address_detail: addressDetail
  };
};

const getValueByMapping = (rowObj, fieldKey) => {
  const possibleHeaders = COLUMN_MAPPING[fieldKey] || [];
  const rowKeys = Object.keys(rowObj);
  for (const key of rowKeys) {
    const normalizedKey = key.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ' ');
    for (const header of possibleHeaders) {
      const normalizedHeader = header.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ' ');
      if (normalizedKey === normalizedHeader) {
        return rowObj[key];
      }
    }
  }
  return null;
};

const norm = (str) => {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(tinh|thanh pho|tp\.|tp|huyen|quan|phuong|xa)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const findProvinceId = (name, provincesList) => {
  if (!name) return null;
  const nName = norm(name);
  const found = provincesList.find(p => norm(p.name) === nName);
  return found ? found.id : null;
};

export const parseExcelFile = (b64) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.read(b64, { type: 'base64' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      resolve(rawRows);
    } catch (err) {
      reject(err);
    }
  });
};

export const processExcelRows = async ({
  rawRows,
  provincesList,
  fetchDistricts,
  fetchWards,
  districtsCache,
  wardsCache,
  defaultSender,
  targetHubId
}) => {
  const mapServiceType = (val) => {
    if (!val) return 'CPN';
    const s = val.toString().trim().toLowerCase();
    if (s.includes('tiet kiem') || s.includes('tiết kiệm') || s.includes('standard') || s.includes('economy') || s.includes('tk')) return 'TK';
    if (s.includes('hoa toc') || s.includes('hỏa tốc') || s.includes('express') || s.includes('ht')) return 'HT';
    if (s.includes('nhanh') || s.includes('fast') || s.includes('cpn')) return 'CPN';
    return 'CPN';
  };

  const parseExtraServices = (val) => {
    if (!val) return [];
    return val.toString().split(',').map(s => s.trim()).filter(Boolean);
  };

  const mapPaymentMethod = (val) => {
    if (!val) return 'SENDER_DEBT';
    const s = val.toString().trim().toLowerCase();
    if (s.includes('gui') || s.includes('người gửi') || s.includes('pay')) return 'SENDER_PAY';
    if (s.includes('nhan') || s.includes('người nhận') || s.includes('thu')) return 'RECEIVER_PAY';
    return 'SENDER_DEBT';
  };

  const normalizeProductGroup = (val) => {
    if (!val) return 'PARCEL';
    const s = val.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    if (s.includes('THU_TU') || s.includes('TAI_LIEU') || s.includes('DOCUMENT') || s.includes('LETTER') || s.includes('DOC')) return 'DOCUMENT';
    if (s.includes('BUU_PHAM') || s.includes('BUU_KIEN') || s.includes('PARCEL') || s.includes('PACKAGE')) return 'PARCEL';
    if (s.includes('THONG_THUONG') || s.includes('GENERAL') || s.includes('GOODS') || s.includes('NORMAL')) return 'GENERAL';
    if (s.includes('CHAT_LONG') || s.includes('LIQUID')) return 'LIQUID';
    if (s.includes('DIEN_TU') || s.includes('ELECTRONIC') || s.includes('ELECTRONICS')) return 'ELECTRONIC';
    if (s.includes('THUC_PHAM') || s.includes('FOOD')) return 'FOOD';
    if (s.includes('GIA_TRI_CAO') || s.includes('HIGH_VALUE') || s.includes('VALUABLE')) return 'HIGH_VALUE';
    return 'PARCEL';
  };

  const parsedRows = [];
  for (const row of rawRows) {
    const senderAddrRaw = getValueByMapping(row, 'sender_address');
    const senderProvRaw = getValueByMapping(row, 'sender_province');
    const parsedSender = parseVietnameseAddress(senderAddrRaw, senderProvRaw);

    const receiverAddrRaw = getValueByMapping(row, 'receiver_address');
    const receiverProvRaw = getValueByMapping(row, 'receiver_province');
    const parsedReceiver = parseVietnameseAddress(receiverAddrRaw, receiverProvRaw);

    parsedRows.push({
      shop_order_code: getValueByMapping(row, 'shop_order_code') || '',
      sender_name: getValueByMapping(row, 'sender_name') || '',
      sender_phone: getValueByMapping(row, 'sender_phone') || '',
      sender_address_detail: parsedSender.address_detail,
      sender_province_name: parsedSender.province_name,
      sender_district_name: parsedSender.district_name,
      sender_ward_name: parsedSender.ward_name,
      senderProvinceId: findProvinceId(parsedSender.province_name, provincesList),
      senderDistrictId: null,
      senderWardId: null,

      receiver_name: getValueByMapping(row, 'receiver_name') || '',
      receiver_phone: getValueByMapping(row, 'receiver_phone') || '',
      receiver_address_detail: parsedReceiver.address_detail,
      receiver_province_name: parsedReceiver.province_name,
      receiver_district_name: parsedReceiver.district_name,
      receiver_ward_name: parsedReceiver.ward_name,
      receiverProvinceId: findProvinceId(parsedReceiver.province_name, provincesList),
      receiverDistrictId: null,
      receiverWardId: null,

      product_group: normalizeProductGroup(getValueByMapping(row, 'product_group')),
      product_name: getValueByMapping(row, 'product_name') || 'Hàng hóa',
      declared_value: Number(getValueByMapping(row, 'declared_value') || 0),
      weight: Number(getValueByMapping(row, 'weight') || 0.5),
      length: Number(getValueByMapping(row, 'length') || 0),
      width: Number(getValueByMapping(row, 'width') || 0),
      height: Number(getValueByMapping(row, 'height') || 0),
      quantity: Number(getValueByMapping(row, 'quantity') || 1),
      payment_method: getValueByMapping(row, 'payment_method') || '',
      cod_amount: Number(getValueByMapping(row, 'cod_amount') || 0),
      service_type: getValueByMapping(row, 'service_type') || '',
      extra_services: getValueByMapping(row, 'extra_services') || ''
    });
  }

  const uniqueProvinceIds = [
    ...new Set([
      ...parsedRows.map(r => r.senderProvinceId),
      ...parsedRows.map(r => r.receiverProvinceId)
    ].filter(Boolean))
  ];

  for (const pId of uniqueProvinceIds) {
    if (!districtsCache[pId]) {
      districtsCache[pId] = await fetchDistricts(pId);
    }
  }

  for (const row of parsedRows) {
    if (row.senderProvinceId && row.sender_district_name) {
      const dists = districtsCache[row.senderProvinceId] || [];
      const match = dists.find(d => norm(d.name) === norm(row.sender_district_name));
      if (match) row.senderDistrictId = match.id;
    }
    if (row.receiverProvinceId && row.receiver_district_name) {
      const dists = districtsCache[row.receiverProvinceId] || [];
      const match = dists.find(d => norm(d.name) === norm(row.receiver_district_name));
      if (match) row.receiverDistrictId = match.id;
    }
  }

  const uniqueDistrictIds = [
    ...new Set([
      ...parsedRows.map(r => r.senderDistrictId),
      ...parsedRows.map(r => r.receiverDistrictId)
    ].filter(Boolean))
  ];

  for (const dId of uniqueDistrictIds) {
    if (!wardsCache[dId]) {
      wardsCache[dId] = await fetchWards(dId);
    }
  }

  for (const row of parsedRows) {
    if (row.senderDistrictId && row.sender_ward_name) {
      const wrds = wardsCache[row.senderDistrictId] || [];
      const match = wrds.find(w => norm(w.name) === norm(row.sender_ward_name));
      if (match) row.senderWardId = match.id;
    }
    if (row.receiverDistrictId && row.receiver_ward_name) {
      const wrds = wardsCache[row.receiverDistrictId] || [];
      const match = wrds.find(w => norm(w.name) === norm(row.receiver_ward_name));
      if (match) row.receiverWardId = match.id;
    }
  }

  return parsedRows.map((row, index) => {
    return {
      sender: {
        name: row.sender_name || defaultSender.name || '',
        phone: row.sender_phone || defaultSender.phone || '',
        province_id: row.senderProvinceId || defaultSender.province_id || null,
        district_id: row.senderDistrictId || defaultSender.district_id || null,
        ward_id: row.senderWardId || defaultSender.ward_id || null,
        address_detail: row.sender_address_detail || defaultSender.address_detail || ''
      },
      receiver: {
        name: row.receiver_name || '',
        phone: row.receiver_phone || '',
        province_id: row.receiverProvinceId || null,
        district_id: row.receiverDistrictId || null,
        ward_id: row.receiverWardId || null,
        address_detail: row.receiver_address_detail || ''
      },
      items: [
        {
          product_group: row.product_group || 'PARCEL',
          product_name: row.product_name || 'Hàng hóa',
          weight: Number(row.weight || 0.5),
          length: Number(row.length || 0),
          width: Number(row.width || 0),
          height: Number(row.height || 0),
          quantity: Number(row.quantity || 1),
          declared_value: Number(row.declared_value || 0)
        }
      ],
      cod_amount: Number(row.cod_amount || 0),
      cod_receiver_pays_fee: false,
      service_type: mapServiceType(row.service_type),
      extra_services: parseExtraServices(row.extra_services),
      delivery_note_option: 'CHO_XEM_HANG',
      note: '',
      payment_method: mapPaymentMethod(row.payment_method),
      target_hub_id: targetHubId || null,
      draft_id: (Date.now() + index).toString(),
      created_at: new Date().toISOString()
    };
  });
};
