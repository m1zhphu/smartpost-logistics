<template>
  <div class="customer-portal">
    <div class="portal-container">
      <el-row :gutter="24" class="portal-content">
        <el-col :span="24">
          <div class="create-pickup-form-wrapper animate-fade-in-up">
            <div class="form-header mb-4">
              <div class="flex-center gap-3">
                <el-button circle @click="cancelCreate">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <div>
                  <h2 class="section-title">Tạo yêu cầu gửi hàng mới</h2>
                  <p class="section-subtitle">Nhập thông tin người gửi, người nhận và gói hàng để tạo vận đơn</p>
                </div>
              </div>
              <div class="form-header-actions">
                <el-dropdown trigger="click">
                  <el-button type="success" plain>
                    <el-icon class="mr-1"><DocumentAdd /></el-icon>Excel <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="triggerExcelImport">
                        <el-icon><DocumentAdd /></el-icon>Nhập từ Excel
                      </el-dropdown-item>
                      <el-dropdown-item @click="downloadTemplate">
                        <el-icon><Download /></el-icon>Tải mẫu Excel
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button @click="saveDraft" type="info" plain>
                  <el-icon class="mr-1"><EditPen /></el-icon>Lưu nháp
                </el-button>
                <el-button @click="addToQueue" type="warning" plain>
                  <el-icon class="mr-1"><FolderAdd /></el-icon>Đưa vào hàng chờ
                </el-button>
              </div>
            </div>

            <el-row :gutter="24">
              <!-- Left side of form: Input fields -->
              <el-col :xs="24" :sm="24" :md="16">
                <el-form :model="form" label-position="top">
                  
                  <!-- SENDER & RECEIVER INFO -->
                  <el-row :gutter="20">
                    <!-- SENDER CARD -->
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card sender-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-primary">
                            <el-icon><User /></el-icon><span>Thông tin Người gửi</span>
                          </div>
                        </template>
                        <el-form-item label="Họ tên người gửi" required>
                          <el-input v-model="form.sender.name" placeholder="Tên người gửi hoặc Tên shop" />
                        </el-form-item>
                        <el-form-item label="Số điện thoại" required>
                          <el-input v-model="form.sender.phone" placeholder="Số điện thoại liên hệ" />
                        </el-form-item>
                        <el-form-item label="Tỉnh/Thành" required>
                          <el-select v-model="form.sender.province_id" placeholder="Chọn tỉnh" @change="handleSenderProvinceChange" filterable style="width: 100%;">
                            <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Quận/Huyện" required>
                          <el-select v-model="form.sender.district_id" placeholder="Chọn huyện" @change="handleSenderDistrictChange" :disabled="!form.sender.province_id" filterable style="width: 100%;">
                            <el-option v-for="d in senderDistricts" :key="d.id" :label="d.name" :value="d.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Phường/Xã">
                          <el-select v-model="form.sender.ward_id" placeholder="Chọn xã" :disabled="!form.sender.district_id" filterable style="width: 100%;">
                            <el-option v-for="w in senderWards" :key="w.id" :label="w.name" :value="w.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Địa chỉ chi tiết (Số nhà, đường...)">
                          <el-input v-model="form.sender.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ lấy hàng chi tiết" />
                        </el-form-item>
                      </el-card>
                    </el-col>

                    <!-- RECEIVER CARD -->
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card receiver-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-success">
                            <el-icon><User /></el-icon><span>Thông tin Người nhận</span>
                          </div>
                        </template>
                        <el-form-item label="Họ tên người nhận" required>
                          <el-autocomplete
                            ref="nameAutocomplete"
                            v-model="form.receiver.name"
                            :fetch-suggestions="queryReceiverByName"
                            clearable
                            placeholder="Tên người nhận hàng"
                            @select="handleSelectReceiver"
                            style="width: 100%;"
                            trigger-on-focus
                          >
                            <template #suffix>
                              <el-icon style="cursor: pointer;" @click="handleTriggerName"><ArrowDown /></el-icon>
                            </template>
                            <template #default="{ item }">
                              <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="fw-bold">{{ item.name }}</span>
                                <span style="font-size: 12px; color: var(--sp-text-muted);">{{ item.phone }}</span>
                              </div>
                            </template>
                          </el-autocomplete>
                        </el-form-item>
                        <el-form-item label="Số điện thoại" required>
                          <el-autocomplete
                            ref="phoneAutocomplete"
                            v-model="form.receiver.phone"
                            :fetch-suggestions="queryReceiverByPhone"
                            clearable
                            placeholder="Số điện thoại liên hệ"
                            @select="handleSelectReceiver"
                            style="width: 100%;"
                            trigger-on-focus
                          >
                            <template #suffix>
                              <el-icon style="cursor: pointer;" @click="handleTriggerPhone"><ArrowDown /></el-icon>
                            </template>
                            <template #default="{ item }">
                              <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="fw-bold text-success">{{ item.phone }}</span>
                                <span style="font-size: 12px; color: var(--sp-text-muted);">{{ item.name }}</span>
                              </div>
                            </template>
                          </el-autocomplete>
                        </el-form-item>
                        <el-form-item label="Tỉnh/Thành" required>
                          <el-select v-model="form.receiver.province_id" placeholder="Chọn tỉnh" @change="handleReceiverProvinceChange" filterable style="width: 100%;">
                            <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Quận/Huyện" required>
                          <el-select v-model="form.receiver.district_id" placeholder="Chọn huyện" @change="handleReceiverDistrictChange" :disabled="!form.receiver.province_id" filterable style="width: 100%;">
                            <el-option v-for="d in receiverDistricts" :key="d.id" :label="d.name" :value="d.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Phường/Xã">
                          <el-select v-model="form.receiver.ward_id" placeholder="Chọn xã" :disabled="!form.receiver.district_id" filterable clearable style="width: 100%;">
                            <el-option v-for="w in receiverWards" :key="w.id" :label="w.name" :value="w.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Địa chỉ chi tiết (Số nhà, đường...)">
                          <el-input v-model="form.receiver.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ giao hàng chi tiết" />
                        </el-form-item>
                      </el-card>
                    </el-col>
                  </el-row>

                  <!-- ITEMS DETAILS -->
                  <el-card class="form-section-card items-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-warning">
                        <el-icon><Box /></el-icon><span>Thông tin Hàng hóa</span>
                      </div>
                    </template>
                    <div v-for="(item, index) in form.items" :key="index" class="item-input-row">
                      <el-row :gutter="16">
                        <el-col :xs="24" :sm="8">
                          <el-form-item label="Tên sản phẩm" required>
                            <el-input v-model="item.product_name" placeholder="Ví dụ: Quần áo, mỹ phẩm..." @input="debouncedSimulate" />
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="6">
                          <el-form-item label="Loại hàng" required>
                            <el-select v-model="item.product_group" placeholder="Chọn loại hàng" class="w-full" @change="debouncedSimulate">
                              <el-option
                                v-for="pt in productTypes"
                                :key="pt.code"
                                :label="pt.label"
                                :value="pt.code"
                              />
                            </el-select>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="12" :sm="5">
                          <el-form-item label="Khối lượng (kg)">
                            <el-input v-model.number="item.weight" type="number" step="0.01" min="0.01" placeholder="0.05" class="w-full" @input="debouncedSimulate">
                              <template #append>kg</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="12" :sm="5">
                          <el-form-item label="Số lượng">
                            <el-input v-model.number="item.quantity" type="number" min="1" placeholder="1" class="w-full" @input="debouncedSimulate">
                              <template #append>cái</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      
                      <el-row :gutter="16" style="margin-top: 12px;">
                        <el-col :xs="24" :sm="14">
                          <el-form-item label="Kích thước cm (Dài x Rộng x Cao)">
                            <div class="dimension-inputs">
                              <el-input v-model.number="item.length" type="number" min="0" placeholder="Dài" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                              <span class="dimension-sep">×</span>
                              <el-input v-model.number="item.width" type="number" min="0" placeholder="Rộng" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                              <span class="dimension-sep">×</span>
                              <el-input v-model.number="item.height" type="number" min="0" placeholder="Cao" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                            </div>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="10">
                          <el-form-item :label="item.product_group === 'HIGH_VALUE' ? 'Khai giá (đ) *' : 'Khai giá (đ)'" :required="item.product_group === 'HIGH_VALUE'">
                            <el-input v-model.number="item.declared_value" type="number" min="0" placeholder="0" class="w-full" @input="debouncedSimulate">
                              <template #append>đ</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>

                      <!-- Warning & Special handling info -->
                      <div v-if="getProductTypeInfo(item.product_group)?.special_handling" class="special-handling-note mt-2 text-warning" style="font-size: 13px; display: flex; align-items: center; gap: 6px; padding: 8px 12px; background-color: #fdf6ec; border-radius: 6px; border-left: 4px solid #e6a23c; margin-bottom: 12px; line-height: 1.4;">
                        <el-icon><Warning /></el-icon>
                        <div>
                          <strong>{{ getProductTypeInfo(item.product_group)?.label }}:</strong> {{ getProductTypeInfo(item.product_group)?.handling_note }}
                          <span v-if="getProductTypeInfo(item.product_group)?.packing_recommended" style="color: #409eff; font-weight: bold; margin-left: 8px;">
                            (Khuyến nghị: Quý khách nên chọn dịch vụ Đóng kiện để đảm bảo an toàn.)
                          </span>
                        </div>
                      </div>
                    </div>
                  </el-card>

                  <!-- SETTINGS & EXTRA SERVICES -->
                  <el-card class="form-section-card settings-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-info">
                        <el-icon><Setting /></el-icon><span>Cấu hình Vận chuyển</span>
                      </div>
                    </template>
                    <el-form-item label="Bưu cục xử lý (Không bắt buộc)">
                      <el-select
                        v-model="form.target_hub_id"
                        class="w-full"
                        filterable
                        clearable
                        placeholder="Hệ thống sẽ tự gợi ý theo tỉnh gửi"
                        @change="debouncedSimulate"
                      >
                        <el-option
                          v-for="hub in activeHubsList"
                          :key="hub.hub_id"
                          :label="`${hub.hub_name}${getProvinceName(hub.province_id) ? ' - ' + getProvinceName(hub.province_id) : ''}`"
                          :value="hub.hub_id"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="Dịch vụ vận chuyển" required>
                      <el-radio-group v-model="form.service_type" @change="debouncedSimulate">
                        <el-radio-button label="TK">Tiết kiệm (TK)</el-radio-button>
                        <el-radio-button label="CPN">Chuyển phát nhanh (CPN)</el-radio-button>
                        <el-radio-button label="HT">Hỏa tốc (HT)</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="Đóng kiện">
                      <el-radio-group v-model="form.packing_type" class="packing-type-group" @change="debouncedSimulate">
                        <el-radio-button :label="null">Không đóng kiện</el-radio-button>
                        <el-radio-button label="WOOD">Đóng kiện gỗ</el-radio-button>
                        <el-radio-button label="FOAM">Đóng kiện xốp</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                    <el-row :gutter="20">
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Số tiền thu hộ (COD)">
                          <el-input-number v-model="form.cod_amount" :min="0" :step="10000" class="w-full" @change="debouncedSimulate" />
                        </el-form-item>
                      </el-col>
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Phương thức thanh toán">
                          <el-select v-model="form.payment_method" class="w-full">
                            <el-option label="Shop trả cước cuối tháng (SENDER_DEBT)" value="SENDER_DEBT" />
                            <el-option label="Shop trả cước ngay khi gửi (SENDER_PAY)" value="SENDER_PAY" />
                            <el-option label="Người nhận thanh toán cước (RECEIVER_PAY)" value="RECEIVER_PAY" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Ghi chú khi giao">
                          <el-select v-model="form.delivery_note_option" class="w-full">
                            <el-option label="Cho xem hàng, không thử (CHO_XEM_HANG)" value="CHO_XEM_HANG" />
                            <el-option label="Cho thử hàng (CHO_THU_HANG)" value="CHO_THU_HANG" />
                            <el-option label="Không cho xem hàng (KHONG_CHO_XEM_HANG)" value="KHONG_CHO_XEM_HANG" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Ghi chú thêm">
                          <el-input v-model="form.note" placeholder="Ghi chú thêm cho bưu tá..." />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-card>

                  <el-card class="form-section-card extra-services-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-primary">
                        <el-icon><CircleCheck /></el-icon><span>Dịch vụ gia tăng</span>
                      </div>
                    </template>
                    <el-checkbox-group v-model="form.extra_services" @change="debouncedSimulate" class="extra-services-checkboxes">
                      <el-checkbox 
                        v-for="srv in availableServices" 
                        :key="srv.service_code" 
                        :label="srv.service_code"
                      >
                        <span class="fw-bold">{{ srv.service_name }}</span>
                        <span class="text-xs text-muted block">
                          Phí: {{ srv.fee_type === 'FIXED' ? srv.fee_value.toLocaleString() + 'đ' : srv.fee_value + '%' }}
                          ({{ 
                            srv.calculation_base === 'DECLARED_VALUE' ? 'Theo giá trị đơn hàng' :
                            srv.calculation_base === 'MAIN_FEE' ? 'Theo cước chính' :
                            srv.calculation_base === 'COD_AMOUNT' ? 'Theo tiền thu hộ COD' :
                            srv.calculation_base === 'QUANTITY' ? 'Theo số lượng sản phẩm' :
                            'Theo bill'
                          }})
                        </span>
                      </el-checkbox>
                    </el-checkbox-group>
                  </el-card>

                </el-form>
              </el-col>

              <!-- Right side: Real-time estimated billing details -->
              <el-col :xs="24" :sm="24" :md="8">
                <el-card class="billing-summary-card mb-4 sticky-card" v-loading="simulateLoading">
                  <template #header>
                    <div class="billing-header text-primary fw-bold text-center">
                      ƯỚC TÍNH CƯỚC PHÍ
                    </div>
                  </template>
                  <div class="billing-details" v-if="simulateResult">
                    <div class="billing-line">
                      <span>Cước chính:</span>
                      <span class="price-val">{{ (simulateResult.main_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line" v-if="simulateResult.fuel_surcharge > 0">
                      <span>Phụ phí xăng dầu:</span>
                      <span class="price-val">{{ (simulateResult.fuel_surcharge || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line">
                      <span>Phí dịch vụ gia tăng:</span>
                      <span class="price-val">{{ (simulateResult.extra_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line" v-if="simulateResult.packing_fee > 0">
                      <span>Phí đóng kiện:</span>
                      <span class="price-val">{{ (simulateResult.packing_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line" v-if="simulateResult.remote_fee > 0">
                      <span>Phụ phí vùng xa:</span>
                      <span class="price-val">{{ (simulateResult.remote_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line">
                      <span>Thuế VAT:</span>
                      <span class="price-val">{{ (simulateResult.vat || simulateResult.vat_8 || 0).toLocaleString() }} đ</span>
                    </div>
                    <el-divider class="my-3" />
                    <div class="billing-line total">
                      <span>TỔNG CỘNG TẠM TÍNH:</span>
                      <span class="price-val text-success">{{ (simulateResult.total || simulateResult.grand_total || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="text-xs text-muted mt-3 text-center">
                      * Cước phí thực tế sẽ được cập nhật sau khi bưu cục cân đo hàng hóa.
                    </div>
                  </div>
                  <div class="billing-error text-center text-warning" style="padding: 20px 10px;" v-else-if="simulateError">
                    <el-icon class="large-icon mb-2" style="font-size: 28px; color: #e6a23c;"><Warning /></el-icon>
                    <p style="font-size: 13px; font-weight: 500; color: #e6a23c;">{{ simulateError }}</p>
                    <p style="font-size: 11px; color: #909399; margin-top: 8px;">Vui lòng chọn Tỉnh đi / Tỉnh đến khác (ví dụ: Hà Nội $\leftrightarrow$ TP. Hồ Chí Minh) đã được cấu hình giá cước trong hệ thống.</p>
                  </div>
                  <div class="billing-placeholder text-center text-muted" v-else>
                    <el-icon class="large-icon mb-2"><InfoFilled /></el-icon>
                    <p>Vui lòng điền địa chỉ người gửi, người nhận và khối lượng hàng hóa để xem cước phí dự kiến.</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>
      <input type="file" ref="excelInput" style="display: none;" accept=".xlsx, .xls" @change="handleExcelUpload" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import { 
  User, DocumentAdd, Box, Setting, CircleCheck, InfoFilled, 
  ArrowLeft, Warning, Download, EditPen, FolderAdd, ArrowDown
} from '@element-plus/icons-vue';
import { parseExcelFile, processExcelRows } from '@/utils/excelParser';

// ---- Dynamic Address API (provinces.open-api.vn) ----
const ADDR_API = 'https://provinces.open-api.vn/api';
const provinces = ref([]);
const productTypes = ref([
  { code: 'DOCUMENT', label: 'Thư từ/Tài liệu', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Dùng cho thư từ, hồ sơ và tài liệu giấy.' },
  { code: 'PARCEL', label: 'Bưu phẩm, bưu kiện', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Dùng cho bưu phẩm và bưu kiện thông thường.' },
  { code: 'GENERAL', label: 'Hàng hóa thông thường', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Hàng hóa không thuộc nhóm cần xử lý đặc biệt.' },
  { code: 'LIQUID', label: 'Chất lỏng', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần bao gói chống rò rỉ và kiểm tra điều kiện vận chuyển.' },
  { code: 'ELECTRONIC', label: 'Điện tử', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần chống va đập; khai báo pin hoặc linh kiện hạn chế nếu có.' },
  { code: 'FOOD', label: 'Thực phẩm', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần khai báo điều kiện bảo quản và hạn sử dụng phù hợp.' },
  { code: 'HIGH_VALUE', label: 'Giá trị cao', special_handling: true, requires_declared_value: true, packing_recommended: true, handling_note: 'Bắt buộc khai giá lớn hơn 0 để kiểm soát và bảo hiểm hàng hóa.' }
]);

const fetchProductTypes = async () => {
  try {
    const res = await api.get('/api/waybills/product-types');
    if (res.data && res.data.items) {
      productTypes.value = res.data.items;
    }
  } catch (err) {
    console.error('Không thể tải danh sách loại hàng', err);
  }
};

const getProductTypeInfo = (code) => {
  return productTypes.value.find(pt => pt.code === code) || null;
};

const excelInput = ref(null);
const districtsCache = {};
const wardsCache = {};

const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);

const fetchProvinces = async () => {
  if (provinces.value.length) return;
  try {
    const res = await fetch(`${ADDR_API}/`);
    const data = await res.json();
    provinces.value = data.map(p => ({ id: p.code, name: p.name }));
  } catch (err) {
    console.error('Không thể tải danh sách tỉnh/thành phố', err);
  }
};

const fetchDistrictsForProvince = async (provinceId) => {
  if (!provinceId) return [];
  const pId = Number(provinceId);
  if (districtsCache[pId]) return districtsCache[pId];
  try {
    const res = await fetch(`${ADDR_API}/p/${pId}?depth=2`);
    const data = await res.json();
    const list = (data.districts || []).map(d => ({ id: d.code, name: d.name }));
    districtsCache[pId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách quận/huyện', err);
    return [];
  }
};

const fetchWardsForDistrict = async (districtId) => {
  if (!districtId) return [];
  const dId = Number(districtId);
  if (wardsCache[dId]) return wardsCache[dId];
  try {
    const res = await fetch(`${ADDR_API}/d/${dId}?depth=2`);
    const data = await res.json();
    const list = (data.wards || []).map(w => ({ id: w.code, name: w.name }));
    wardsCache[dId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách phường/xã', err);
    return [];
  }
};

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const customerInfo = ref({
  customer_code: '',
  phone_number: '',
  email: authStore.user?.email || '',
  address_detail: '',
  province_id: null,
  district_id: null,
  ward_id: null,
  address_detail_custom: ''
});

// Portal View States
const showCreateForm = ref(true);
const submitLoading = ref(false);
const simulateLoading = ref(false);
const draftsList = ref([]);
const savedDraftsList = ref([]);

// Available Extra Services List
const availableServices = ref([]);

// Form model
const form = reactive({
  sender: {
    name: '',
    phone: '',
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  receiver: {
    name: '',
    phone: '',
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  items: [
    {
      product_group: 'PARCEL',
      product_name: '',
      weight: 0.5,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      declared_value: 0
    }
  ],
  cod_amount: 0,
  cod_receiver_pays_fee: false,
  service_type: 'CPN',
  extra_services: [],
  packing_type: null,
  delivery_note_option: 'CHO_XEM_HANG',
  note: '',
  payment_method: 'SENDER_DEBT',
  target_hub_id: null
});

const hubsList = ref([]);

// Simulation price result
const simulateResult = ref(null);
const simulateError = ref('');

const getProvinceName = (id) => provinces.value.find(p => Number(p.id) === Number(id))?.name || '';

const normalizeAddressText = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim();

const isActiveHub = (hub) => hub?.status === true || hub?.status === 1 || hub?.status === 'ACTIVE';

const activeHubsList = computed(() => hubsList.value.filter(isActiveHub));

const autoProcessingHub = computed(() => {
  const provinceId = Number(form.sender.province_id || 0);
  if (!provinceId) return null;

  const activeHubs = activeHubsList.value;
  const exactMatch = activeHubs.find(hub => Number(hub.province_id) === provinceId);
  if (exactMatch) return exactMatch;

  const provinceName = normalizeAddressText(getProvinceName(provinceId));
  if (!provinceName) return null;

  return activeHubs.find((hub) => {
    const hubText = normalizeAddressText(`${hub.hub_name || ''} ${hub.address_detail || ''}`);
    return hubText.includes(provinceName);
  }) || null;
});

const syncAutoProcessingHub = () => {
  form.target_hub_id = autoProcessingHub.value?.hub_id || null;
};

watch(autoProcessingHub, syncAutoProcessingHub);

const handleSenderProvinceChange = async () => {
  form.sender.district_id = null;
  form.sender.ward_id = null;
  senderWards.value = [];
  if (form.sender.province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
  } else {
    senderDistricts.value = [];
  }
  debouncedSimulate();
};

const handleSenderDistrictChange = async () => {
  form.sender.ward_id = null;
  if (form.sender.district_id) {
    senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
  } else {
    senderWards.value = [];
  }
};

const handleReceiverProvinceChange = async () => {
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  receiverWards.value = [];
  if (form.receiver.province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
  } else {
    receiverDistricts.value = [];
  }
  debouncedSimulate();
};

const handleReceiverDistrictChange = async () => {
  form.receiver.ward_id = null;
  if (form.receiver.district_id) {
    receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
  } else {
    receiverWards.value = [];
  }
};

const mapStandardProvinceToHubProvince = (standardId, targetHubId = null) => {
  const id = Number(standardId);
  return {
    province_id: id || null,
    province_name: getProvinceName(id)
  };
};

// SIMULATE ESTIMATED SHIPPING FEE
let simulateTimeout = null;
const debouncedSimulate = () => {
  if (simulateTimeout) clearTimeout(simulateTimeout);
  simulateTimeout = setTimeout(triggerSimulation, 400);
};

const triggerSimulation = async () => {
  if (!form.sender.province_id || !form.receiver.province_id) {
    simulateResult.value = null;
    return;
  }
  
  const validItems = form.items.filter(item => Number(item.weight || 0) > 0);
  if (!validItems.length) {
    simulateResult.value = null;
    simulateError.value = '';
    return;
  }
  
  simulateLoading.value = true;
  simulateError.value = '';
  try {
    const mappedSender = mapStandardProvinceToHubProvince(form.sender.province_id, form.target_hub_id);
    const mappedReceiver = mapStandardProvinceToHubProvince(form.receiver.province_id);

    const actualWeight = validItems.reduce((total, item) => {
      return total + (Number(item.weight || 0) * Number(item.quantity || 1));
    }, 0);
    const convertedWeight = validItems.reduce((total, item) => {
      if (!item.length || !item.width || !item.height) return total;
      return total + ((Number(item.length) * Number(item.width) * Number(item.height)) / 5000) * Number(item.quantity || 1);
    }, 0);
    const chargeWeight = Math.max(actualWeight, convertedWeight, 0.01);
    const declaredValue = validItems.reduce((total, item) => {
      return total + (Number(item.declared_value || 0) * Number(item.quantity || 1));
    }, 0);
    const totalQuantity = validItems.reduce((total, item) => total + Number(item.quantity || 1), 0);

    const payload = {
      origin_province_id: Number(mappedSender.province_id),
      dest_province_id: Number(mappedReceiver.province_id),
      weight: Number(chargeWeight.toFixed(2)),
      length: 0,
      width: 0,
      height: 0,
      service_type: form.service_type,
      cod_amount: Number(form.cod_amount || 0),
      declared_value: declaredValue,
      quantity: totalQuantity,
      packing_type: form.packing_type || null,
      extra_services: form.extra_services
    };
    
    const res = await api.post('/api/pricing/simulate', payload);
    if (res.data && res.data.status === 'SUCCESS') {
      simulateResult.value = res.data;
    } else {
      simulateResult.value = null;
      simulateError.value = 'Không thể tính phí tự động.';
    }
  } catch (err) {
    console.error('Error simulating price:', err);
    simulateResult.value = null;
    simulateError.value = err.response?.data?.detail || 'Tuyến đường này chưa được cấu hình giá cước.';
  } finally {
    simulateLoading.value = false;
  }
};

const fetchAvailableServices = async () => {
  try {
    const res = await api.get('/api/pricing/extra-services');
    availableServices.value = res.data || [];
  } catch (err) {
    console.error('Error fetching extra services:', err);
  }
};

const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubsList.value = Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []);
  } catch (err) {
    console.error('Error fetching hubs:', err);
  }
};

const saveDraft = () => {
  const resumeDraftId = route.query.resume_draft_id;
  if (resumeDraftId) {
    savedDraftsList.value = savedDraftsList.value.filter(d => d.draft_id !== resumeDraftId);
    draftsList.value = draftsList.value.filter(d => d.draft_id !== resumeDraftId);
    localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  }

  if (savedDraftsList.value.length >= 20) {
    ElMessage.warning('Chỉ lưu tối đa 20 bản nháp! Vui lòng xóa bớt.');
    return;
  }
  syncAutoProcessingHub();
  
  const newDraft = {
    ...JSON.parse(JSON.stringify(form)),
    draft_id: Date.now().toString(),
    created_at: new Date().toISOString()
  };

  savedDraftsList.value.push(newDraft);
  localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
  ElMessage.success('Đã lưu bản nháp thành công!');

  if (resumeDraftId) {
    router.replace({ query: {} });
  }
};

const addToQueue = () => {
  const resumeDraftId = route.query.resume_draft_id;
  if (resumeDraftId) {
    draftsList.value = draftsList.value.filter(d => d.draft_id !== resumeDraftId);
    savedDraftsList.value = savedDraftsList.value.filter(d => d.draft_id !== resumeDraftId);
    localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
  }

  if (draftsList.value.length >= 10) {
    ElMessage.warning('Hàng chờ chỉ lưu tối đa 10 đơn! Vui lòng xóa bớt hoặc gửi yêu cầu.');
    return;
  }
  
  if (!form.sender.name || !form.sender.phone || !form.sender.province_id || !form.sender.district_id ||
      !form.receiver.name || !form.receiver.phone || !form.receiver.province_id || !form.receiver.district_id) {
    ElMessage.warning('Vui lòng điền đủ thông tin người gửi và người nhận trước khi đưa vào hàng chờ.');
    return;
  }
  if (!form.items[0].product_name) {
    ElMessage.warning('Vui lòng điền đủ thông tin cơ bản trước khi đưa vào hàng chờ.');
    return;
  }

  // Validate items
  for (let i = 0; i < form.items.length; i++) {
    const item = form.items[i];
    if (!item.product_group) {
      ElMessage.warning(`Vui lòng chọn loại hàng cho sản phẩm thứ ${i + 1}.`);
      return;
    }
    if (item.weight === undefined || item.weight === null || item.weight === '' || Number(item.weight) <= 0) {
      ElMessage.warning(`Khối lượng sản phẩm thứ ${i + 1} phải lớn hơn 0.`);
      return;
    }
    if (item.quantity === undefined || item.quantity === null || item.quantity === '' || Number(item.quantity) < 1) {
      ElMessage.warning(`Số lượng sản phẩm thứ ${i + 1} phải lớn hơn hoặc bằng 1.`);
      return;
    }
    if (item.declared_value === undefined || item.declared_value === null || item.declared_value === '' || Number(item.declared_value) < 0) {
      ElMessage.warning(`Giá trị khai báo sản phẩm thứ ${i + 1} phải lớn hơn hoặc bằng 0.`);
      return;
    }
    if (item.product_group === 'HIGH_VALUE' && (!item.declared_value || Number(item.declared_value) <= 0)) {
      ElMessage.warning('Hàng giá trị cao bắt buộc phải có giá trị khai báo lớn hơn 0.');
      return;
    }
  }

  syncAutoProcessingHub();

  const newDraft = {
    ...JSON.parse(JSON.stringify(form)),
    draft_id: Date.now().toString(),
    created_at: new Date().toISOString()
  };

  draftsList.value.push(newDraft);
  localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  localStorage.removeItem('customer_pickup_draft');
  
  ElMessage.success(`Đã đưa vào hàng chờ đơn thứ ${draftsList.value.length}. Bạn có thể tiếp tục tạo đơn mới.`);

  // Auto save to recipient book
  saveToAddressBook(form.receiver);
  
  form.receiver.name = '';
  form.receiver.phone = '';
  form.receiver.province_id = null;
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  form.receiver.address_detail = '';
  receiverDistricts.value = [];
  receiverWards.value = [];

  form.items = [{ product_group: 'PARCEL', product_name: '', weight: 0.5, length: 0, width: 0, height: 0, quantity: 1, declared_value: 0 }];
  form.cod_amount = 0;
  form.note = '';

  if (resumeDraftId) {
    router.replace({ query: {} });
  }
};

const loadDrafts = () => {
  try {
    const storedQueue = localStorage.getItem('customer_pickup_queue');
    if (storedQueue) {
      draftsList.value = JSON.parse(storedQueue);
    }
  } catch (e) {
    console.error('Lỗi khi tải hàng chờ', e);
  }
  
  try {
    const storedDrafts = localStorage.getItem('customer_pickup_drafts');
    if (storedDrafts) {
      savedDraftsList.value = JSON.parse(storedDrafts);
    }
  } catch (e) {
    console.error('Lỗi khi tải bản nháp', e);
  }
};

const triggerExcelImport = () => {
  excelInput.value.click();
};

const handleExcelUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (provinces.value.length === 0) {
      await fetchProvinces();
    }

    ElMessage.info('Đang đọc file Excel...');
    const rawRows = await parseExcelFile(file);

    if (rawRows.length === 0) {
      ElMessage.warning('File Excel không có dữ liệu.');
      return;
    }

    ElMessage.info(`Đang phân tích ${rawRows.length} dòng dữ liệu...`);

    const defaultSender = {
      name: form.sender?.name || authStore.user?.full_name || customerInfo.value?.transaction_name || '',
      phone: form.sender?.phone || customerInfo.value?.phone_number || '',
      province_id: form.sender?.province_id || customerInfo.value?.province_id || null,
      district_id: form.sender?.district_id || customerInfo.value?.district_id || null,
      ward_id: form.sender?.ward_id || customerInfo.value?.ward_id || null,
      address_detail: form.sender?.address_detail || customerInfo.value?.address_detail || ''
    };

    const importedDrafts = await processExcelRows({
      rawRows,
      provincesList: provinces.value,
      fetchDistricts: fetchDistrictsForProvince,
      fetchWards: fetchWardsForDistrict,
      districtsCache,
      wardsCache,
      defaultSender,
      targetHubId: form.target_hub_id
    });

    if (importedDrafts.length === 0) {
      ElMessage.warning('Không phân tích được đơn hàng hợp lệ nào từ file Excel.');
      event.target.value = '';
      return;
    }

    try {
      await ElMessageBox.confirm(
        `Hệ thống đã đọc và phân tích thành công ${importedDrafts.length} đơn hàng hợp lệ từ file Excel. Bạn có muốn đưa ${importedDrafts.length} đơn hàng này vào hàng chờ không?`,
        'Xác nhận nhập dữ liệu',
        {
          confirmButtonText: 'Đồng ý',
          cancelButtonText: 'Hủy',
          type: 'success'
        }
      );
    } catch (e) {
      ElMessage.info('Đã hủy nhập dữ liệu từ Excel');
      event.target.value = '';
      return;
    }

    draftsList.value.push(...importedDrafts);
    localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));

    ElMessage.success(`Nhập thành công ${importedDrafts.length} đơn vào hàng chờ.`);
    event.target.value = '';

    router.push('/customer/queue');
  } catch (err) {
    console.error(err);
    ElMessage.error('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file.');
  }
};

const downloadTemplate = () => {
  const link = document.createElement('a');
  link.href = '/template-import.xlsx';
  link.download = 'template-import.xlsx';
  link.click();
};

// ---- Local Storage Address Book Suggestions ----
const nameAutocomplete = ref(null);
const phoneAutocomplete = ref(null);

const handleTriggerName = () => {
  if (nameAutocomplete.value) {
    // Force open suggestion box by focusing it
    nameAutocomplete.value.focus();
  }
};

const handleTriggerPhone = () => {
  if (phoneAutocomplete.value) {
    // Force open suggestion box by focusing it
    phoneAutocomplete.value.focus();
  }
};

const storageKey = computed(() => 'customer_recipients_' + (authStore.user?.id || authStore.user?.username || 'global'));

const getSavedRecipients = () => {
  try {
    const raw = localStorage.getItem(storageKey.value);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading recipients from local storage', e);
    return [];
  }
};

const queryReceiverByName = (queryString, cb) => {
  const list = getSavedRecipients();
  const results = queryString
    ? list.filter(item => item.name && item.name.toLowerCase().includes(queryString.toLowerCase()))
    : list;
  cb(results);
};

const queryReceiverByPhone = (queryString, cb) => {
  const list = getSavedRecipients();
  const results = queryString
    ? list.filter(item => item.phone && item.phone.includes(queryString))
    : list;
  cb(results);
};

const handleSelectReceiver = async (item) => {
  form.receiver.name = item.name || '';
  form.receiver.phone = item.phone || '';
  form.receiver.province_id = item.province_id || null;
  
  if (item.province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(item.province_id);
    form.receiver.district_id = item.district_id || null;
  } else {
    receiverDistricts.value = [];
    form.receiver.district_id = null;
  }
  
  if (item.district_id) {
    receiverWards.value = await fetchWardsForDistrict(item.district_id);
    form.receiver.ward_id = item.ward_id || null;
  } else {
    receiverWards.value = [];
    form.receiver.ward_id = null;
  }
  
  form.receiver.address_detail = item.address_detail || '';
  
  debouncedSimulate();
};

const saveToAddressBook = (receiver) => {
  if (!receiver.name || !receiver.phone || !receiver.province_id) return;
  const list = getSavedRecipients();
  const index = list.findIndex(item => item.phone === receiver.phone);
  if (index >= 0) {
    list[index] = {
      ...list[index],
      name: receiver.name,
      province_id: receiver.province_id,
      district_id: receiver.district_id,
      ward_id: receiver.ward_id,
      address_detail: receiver.address_detail
    };
  } else {
    list.push({
      id: Date.now().toString(),
      name: receiver.name,
      phone: receiver.phone,
      province_id: receiver.province_id,
      district_id: receiver.district_id,
      ward_id: receiver.ward_id,
      address_detail: receiver.address_detail,
      created_at: new Date().toISOString()
    });
  }
  localStorage.setItem(storageKey.value, JSON.stringify(list));
};

const hasUnsavedData = () => {
  if (!showCreateForm.value) return false;
  
  const hasReceiverInfo = !!(
    form.receiver.name ||
    form.receiver.phone ||
    form.receiver.province_id ||
    form.receiver.district_id ||
    form.receiver.ward_id ||
    form.receiver.address_detail
  );
  
  const hasItemsInfo = form.items.some(item => 
    item.product_name || 
    (item.weight !== 0.5 && item.weight !== 0) || 
    item.length > 0 || 
    item.width > 0 || 
    item.height > 0 || 
    item.quantity > 1 || 
    item.declared_value > 0
  );
  
  const hasOtherInfo = form.cod_amount > 0 || form.note || form.extra_services.length > 0;
  
  return hasReceiverInfo || hasItemsInfo || hasOtherInfo;
};

const promptSaveDraft = () => {
  return new Promise((resolve) => {
    if (!hasUnsavedData()) {
      resolve(true);
      return;
    }

    ElMessageBox.confirm(
      'Nếu bạn rời khỏi thì dữ liệu nhập hiện tại sẽ mất, bạn có muốn lưu nháp không?',
      'Cảnh báo mất dữ liệu',
      {
        confirmButtonText: 'Lưu nháp',
        cancelButtonText: 'Không lưu',
        type: 'warning',
        distinguishCancelAndClose: true,
        showClose: true,
      }
    )
      .then(() => {
        saveDraft();
        resolve(true);
      })
      .catch((action) => {
        if (action === 'cancel') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
  });
};

const cancelCreate = async () => {
  const allow = await promptSaveDraft();
  if (allow) {
    showCreateForm.value = false;
    router.push({ query: { tab: 'dashboard' } });
  }
};

onBeforeRouteLeave(async (to, from, next) => {
  const allow = await promptSaveDraft();
  if (allow) {
    next();
  } else {
    next(false);
  }
});

const handleBeforeUnload = (event) => {
  if (hasUnsavedData()) {
    event.preventDefault();
    event.returnValue = 'Nếu bạn rời khỏi thì dữ liệu nhập hiện tại sẽ mất.';
    return event.returnValue;
  }
};

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  if (!authStore.user) return;

  loadDrafts();

  await fetchProvinces();
  await fetchProductTypes();

  const resumeDraftId = route.query.resume_draft_id;
  if (resumeDraftId) {
    const storedQueue = localStorage.getItem('customer_pickup_queue');
    const storedDrafts = localStorage.getItem('customer_pickup_drafts');
    let found = null;
    if (storedQueue) {
      const parsed = JSON.parse(storedQueue);
      found = parsed.find(d => d.draft_id === resumeDraftId);
    }
    if (!found && storedDrafts) {
      const parsed = JSON.parse(storedDrafts);
      found = parsed.find(d => d.draft_id === resumeDraftId);
    }
    if (found) {
      Object.assign(form, JSON.parse(JSON.stringify(found)));
      if (form.sender.province_id) senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
      if (form.sender.district_id) senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
      if (form.receiver.province_id) receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
      if (form.receiver.district_id) receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
      debouncedSimulate();
      showCreateForm.value = true;
      
      fetchAvailableServices();
      fetchHubs();
      return;
    }
  }

  let activeUser = authStore.user;
  try {
    const meRes = await api.get('/api/auth/me');
    if (meRes.data) {
      activeUser = {
        ...authStore.user,
        ...meRes.data
      };
      authStore.user = activeUser;
      localStorage.setItem('user', JSON.stringify(activeUser));
    }
  } catch (err) {
    console.error('Không thể gọi API /api/auth/me', err);
  }

  try {
    const res = await api.get('/api/customers/me');
    customerInfo.value = {
      ...customerInfo.value,
      ...res.data,
      phone_number: res.data.phone_number || res.data.phone || activeUser.phone_number || '',
      email: res.data.email || activeUser.email || ''
    };

    if (customerInfo.value.province_id) {
      const dists = await fetchDistrictsForProvince(customerInfo.value.province_id);
      senderDistricts.value = dists;
    }
    if (customerInfo.value.district_id) {
      const wrds = await fetchWardsForDistrict(customerInfo.value.district_id);
      senderWards.value = wrds;
    }

    form.sender.name = activeUser.full_name || customerInfo.value.transaction_name || '';
    form.sender.phone = customerInfo.value.phone_number || '';
    form.sender.province_id = customerInfo.value.province_id || null;
    form.sender.district_id = customerInfo.value.district_id || null;
    form.sender.ward_id = customerInfo.value.ward_id || null;
    form.sender.address_detail = customerInfo.value.address_detail || '';
  } catch (err) {
    console.error('Không thể tải thông tin hồ sơ khách hàng', err);
    customerInfo.value = {
      customer_code: 'REG-PENDING',
      phone_number: activeUser.phone_number || 'Chưa cập nhật',
      email: activeUser.email || '',
      address_detail: '',
      province_id: null,
      district_id: null,
      ward_id: null
    };
  }

  fetchAvailableServices();
  fetchHubs();
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>
<style scoped src="./CustomerPortal.css"></style>
